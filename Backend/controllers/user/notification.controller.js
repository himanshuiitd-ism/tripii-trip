import { Notification } from "../../models/user/notification.model.js";
import { User } from "../../models/user/user.model.js";

import mongoose from "mongoose";
import { Trip } from "../../models/trip/trip.model.js";
import { TripWallet } from "../../models/trip/tripWallet.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { emitToUser } from "../../socket/server.js";

/* ============================================================
   🔥 1. UNIVERSAL SEND NOTIFICATION FUNCTION (USE EVERYWHERE)
============================================================ */
export const sendNotification = async ({
  recipient,
  sender = null,
  type,
  message,
  post = null,
  reel = null,
  comment = null,
  community = null,
  trip = null,
  wallet = null,
  settlement = null,
  metadata = {},
}) => {
  if (!recipient || !type || !message)
    throw new Error("Missing required notification fields");

  // DO NOT notify self
  if (sender && recipient.toString() === sender.toString()) return null;

  // Build object dynamically
  const data = {
    recipient,
    sender,
    type,
    message,
    metadata,
  };

  if (post) data.post = post;
  if (reel) data.reel = reel;
  if (comment) data.comment = comment;
  if (community) data.community = community;
  if (trip) data.trip = trip;
  if (wallet) data.wallet = wallet;
  if (settlement) data.settlement = settlement;

  const notification = await Notification.create(data);

  // Real-time push
  emitToUser(recipient, "new_notification", notification);

  return notification;
};

/* ============================================================
   🔥 2. GET ALL NOTIFICATIONS (PAGINATED)
============================================================ */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = Number(req.query.page) || 1;
  const limit = 20;

  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "username profilePicture.url")
    .populate("post", "images coverImage")
    .populate("reel", "thumbnail")
    .populate("comment", "text")
    .populate("community", "name icon")
    .populate("trip", "title location")
    .lean();

  const unread = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      unread,
      currentPage: page,
    })
  );
});

/* ============================================================
   🔥 3. MARK ONE NOTIFICATION AS READ
============================================================ */
export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );

  if (!updated) throw new ApiError(404, "Notification not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Notification marked read"));
});

/* ============================================================
   🔥 4. MARK ALL AS READ
============================================================ */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All notifications marked as read"));
});

/* ============================================================
   🔥 5. MARK ALL AS SEEN (notification pop-up opened)
============================================================ */
export const markAllAsSeen = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Notification.updateMany(
    { recipient: userId, isSeen: false },
    { isSeen: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notifications marked as seen"));
});

/* ============================================================
   🔥 6. DELETE ONE NOTIFICATION
============================================================ */
export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!deleted) throw new ApiError(404, "Notification not found");

  return res.status(200).json(new ApiResponse(200, {}, "Notification deleted"));
});

/* ============================================================
   🔥 7. TRIP INVITE (NEW, CLEAN VERSION)
============================================================ */

export const sendTripInvite = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { receiverId, tripId } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (trip.participants.some((id) => id.toString() === receiverId))
    throw new ApiError(400, "User already in trip");

  const existingInvite = await Notification.findOne({
    recipient: receiverId,
    sender: senderId,
    trip: tripId,
    type: "trip_invite",
    "metadata.actionStatus": "pending",
  });

  if (existingInvite) throw new ApiError(400, "Invite already sent");

  const noti = await sendNotification({
    recipient: receiverId,
    sender: senderId,
    type: "trip_invite",
    message: "invited you to join a trip",
    trip: tripId,
    metadata: { actionStatus: "pending" },
  });

  return res.status(200).json(new ApiResponse(200, noti));
});

/* ============================================================
   🔥 8. ASK TO JOIN TRIP
============================================================ */
export const askToJoinTrip = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { tripId } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (trip.createdBy.toString() === userId.toString())
    throw new ApiError(400, "You created this trip");

  if (trip.participants.some((id) => id.toString() === userId.toString()))
    throw new ApiError(400, "Already a member");

  const noti = await sendNotification({
    recipient: trip.createdBy,
    sender: userId,
    type: "trip_join_request",
    message: "requested to join your trip",
    trip: tripId,
    metadata: { actionStatus: "pending" },
  });

  return res.status(200).json(new ApiResponse(200, noti));
});

/* ============================================================
   🔥 9. ACCEPT JOIN REQUEST
============================================================ */
export const acceptJoinRequest = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const { notificationId } = req.body;

  const noti = await Notification.findOne({
    _id: notificationId,
    recipient: ownerId,
    type: "trip_join_request",
  });

  if (!noti) throw new ApiError(404, "Join request not found");
  if (noti.metadata?.actionStatus !== "pending")
    throw new ApiError(400, "Request already handled");

  const trip = await Trip.findById(noti.trip);
  if (!trip) throw new ApiError(404, "Trip not found");

  const requester = noti.sender;

  if (!trip.participants.some((id) => id.toString() === requester.toString())) {
    trip.participants.push(requester);
    await trip.save();
  }

  const wallet = await TripWallet.findOne({ trip: trip._id });
  if (
    wallet &&
    !wallet.participants.some((id) => id.toString() === requester.toString())
  ) {
    wallet.participants.push(requester);
    await wallet.save();
  }

  await User.findByIdAndUpdate(requester, {
    $addToSet: { trips: trip._id },
  });

  noti.metadata.actionStatus = "accepted";
  noti.isRead = true;
  await noti.save();

  await sendNotification({
    recipient: requester,
    sender: ownerId,
    type: "trip_join_accepted",
    message: "accepted your request to join the trip",
    trip: trip._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { tripId: trip._id, status: "accepted" }));
});

//need some correction (models are not imported correctly)
export const cancelTripInvite = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { notificationId } = req.body;

  const noti = await Notification.findOne({
    _id: notificationId,
    sender: senderId,
    type: "trip_invite",
  });

  if (!noti) throw new ApiError(404, "Invite not found");

  if (noti.metadata?.actionStatus !== "pending") {
    throw new ApiError(400, "Invite already handled");
  }

  noti.metadata.actionStatus = "cancelled";
  await noti.save();

  // Real-time update for recipient
  emitToUser(noti.recipient, "notification_cancelled", {
    notificationId: noti._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { status: "cancelled" }, "Invite cancelled"));
});
