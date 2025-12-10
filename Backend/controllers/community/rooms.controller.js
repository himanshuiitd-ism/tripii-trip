import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";

import { User } from "../../models/user/user.model.js";
import { Community } from "../../models/community/community.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { Room } from "../../models/community/room.model.js";
import { MessageInRoom } from "../../models/community/messageInRoom.model.js";
import { Trip } from "../../models/trip/trip.model.js";
import { Activity } from "../../models/community/activity.model.js";

import { sendNotification } from "../notification.controller.js";
import { io } from "../../socket/socket.js";

/**
 * Upload media helper for room messages
 */
const uploadRoomMedia = async (file, roomId) => {
  const uri = getDataUri(file);
  const folder = `rooms/${roomId}/media`;

  const result = await cloudinary.uploader.upload(uri.content, {
    folder,
    resource_type: "auto",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: file.mimetype,
    originalName: file.originalname,
  };
};

export const createRoom = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const {
    name,
    description = "",
    startDate,
    endDate,
    roomtype, // Normal | Trip
    isEphemeral = false,
    tags = [],
    initialMembers = [],

    // Trip-only
    tripType,
    location,
  } = req.body;

  /* ------------------------------------------------------
   VALIDATIONS
  ------------------------------------------------------ */

  if (!name?.trim()) throw new ApiError(400, "Room name is required");
  if (!startDate || !endDate)
    throw new ApiError(400, "Start and end date are required");

  if (new Date(startDate) >= new Date(endDate))
    throw new ApiError(400, "End date must be after start date");

  if (!["Normal", "Trip"].includes(roomtype))
    throw new ApiError(400, "roomtype must be Normal or Trip");

  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, "Community not found");

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });
  if (!membership)
    throw new ApiError(403, "Only community members can create rooms");

  if (!community.settings.allowMemberRooms && membership.role !== "admin")
    throw new ApiError(403, "Only admins can create rooms");

  // Trip-only required fields
  if (roomtype === "Trip") {
    if (!tripType || !["national", "international"].includes(tripType))
      throw new ApiError(400, "tripType (national/international) is required");

    if (!location?.name)
      throw new ApiError(400, "location.name is required for trip");
  }

  /* ------------------------------------------------------
   UPLOAD BACKGROUND IMAGE
  ------------------------------------------------------ */

  const bgFile = req.files?.backgroundImage?.[0];
  if (!bgFile) throw new ApiError(400, "Room background image is required");

  const uri = getDataUri(bgFile);

  const uploadedBg = await cloudinary.uploader.upload(uri.content, {
    folder: `communities/${communityId}/rooms/backgrounds`,
    transformation: [
      { width: 1400, height: 800, crop: "fill", quality: "auto" },
    ],
  });

  const roombackgroundImage = {
    url: uploadedBg.secure_url,
    publicId: uploadedBg.public_id,
  };

  /* ------------------------------------------------------
   BUILD ROOM MEMBER LIST
  ------------------------------------------------------ */

  const roomMembers = [{ user: userId, role: "owner", joinedAt: new Date() }];

  for (const memberId of initialMembers) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) continue;
    if (memberId === userId.toString()) continue;

    const mem = await CommunityMembership.findOne({
      community: communityId,
      user: memberId,
    });

    if (mem) {
      roomMembers.push({
        user: memberId,
        role: "member",
        joinedAt: new Date(),
      });
    }
  }

  /* ------------------------------------------------------
   CREATE ROOM
  ------------------------------------------------------ */

  const room = await Room.create({
    name: name.trim(),
    description: description.trim(),
    parentCommunity: communityId,
    createdBy: userId,
    roombackgroundImage,
    members: roomMembers,
    startDate,
    endDate,
    tags,
    isEphemeral,
    roomtype,
    status: new Date(startDate) > new Date() ? "upcoming" : "active",
  });

  let trip = null;

  /* ------------------------------------------------------
   CREATE TRIP (IF APPLICABLE)
  ------------------------------------------------------ */

  if (roomtype === "Trip") {
    trip = await Trip.create({
      // shared values
      title: name,
      description,
      startDate,
      endDate,
      coverPhoto: roombackgroundImage,
      createdBy: userId,
      participants: roomMembers.map((m) => m.user),

      // Trip-only fields
      type: tripType,
      location,
      visibility: "private",
      visibleInCommunities: [communityId],
      roomsReleted: [room._id],
      status: "planning",
      createdByType: "user",
    });

    // link room → trip
    room.linkedTrip = trip._id;

    // external link for frontend navigation
    room.externalLink = {
      label: "Open Trip",
      url: `${process.env.FRONTEND_URL}/trip/${trip._id}`,
    };

    await room.save();
  }

  /* ------------------------------------------------------
   SAVE ROOM TO COMMUNITY + USERS
  ------------------------------------------------------ */

  await Community.updateOne(
    { _id: communityId },
    { $addToSet: { rooms: room._id } }
  );

  await User.updateMany(
    { _id: { $in: roomMembers.map((m) => m.user) } },
    { $addToSet: { rooms: room._id } }
  );

  /* ------------------------------------------------------
   ACTIVITY LOG
  ------------------------------------------------------ */

  const activity = await Activity.create({
    community: communityId,
    actor: userId,
    type: roomtype === "Trip" ? "trip_created" : "room_created",
    payload: {
      roomId: room._id,
      tripId: trip ? trip._id : null,
      name: room.name,
    },
  });

  /* ------------------------------------------------------
   NOTIFICATIONS
  ------------------------------------------------------ */

  await Promise.all(
    roomMembers
      .filter((m) => m.user.toString() !== userId.toString()) // skip creator
      .map(async (member) => {
        const memberId = member.user.toString();

        // Room notification
        await sendNotification({
          recipient: memberId,
          sender: userId,
          type: "room_added",
          message:
            roomtype === "Trip"
              ? `${req.user.username} added you to a new trip room: ${room.name}`
              : `${req.user.username} added you to a new room: ${room.name}`,
          room: room._id,
          community: communityId,
          metadata: { roomId: room._id, communityId },
        });

        // Trip notification
        if (roomtype === "Trip" && trip) {
          await sendNotification({
            recipient: memberId,
            sender: userId,
            type: "trip_invite",
            message: `${req.user.username} created a trip: ${trip.title}`,
            trip: trip._id,
            community: communityId,
            metadata: {
              tripId: trip._id,
              roomId: room._id,
            },
          });
        }
      })
  );

  /* ------------------------------------------------------
   SOCKET BROADCAST TO COMMUNITY
  ------------------------------------------------------ */

  io.to(communityId.toString()).emit("roomCreated", {
    room: await room.populate("createdBy", "username profilePicture.url"),
    trip,
    activity,
  });

  /* ------------------------------------------------------
   RESPONSE
  ------------------------------------------------------ */

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { room, trip },
        roomtype === "Trip"
          ? "Trip room and linked trip created successfully"
          : "Room created successfully"
      )
    );
});

export const getCommunityRooms = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  // Validate community membership
  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can view rooms of this community");
  }

  // --- Fetch user's following/followers ---
  const user = await User.findById(userId).select("following followers").lean();

  const followingSet = new Set(user.following.map((id) => id.toString()));
  const followersSet = new Set(user.followers.map((id) => id.toString()));

  // --- Fetch rooms ---
  const rooms = await Room.find({ parentCommunity: communityId })
    .populate("createdBy", "username profilePicture.url")
    .populate("linkedTrip", "title startDate endDate location")
    .populate({
      path: "members.user",
      select: "username profilePicture.url",
    })
    .sort({ createdAt: -1 })
    .lean();

  // --- Sort members in each room ---
  const processedRooms = rooms.map((room) => ({
    ...room,
    members: sortMembers(room.members, followingSet, followersSet),
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { rooms: processedRooms },
        "Rooms in this community fetched"
      )
    );
});

export const getMyCommunityRooms = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  // Validate membership
  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can view rooms of this community");
  }

  // --- Fetch user's follow relations ---
  const user = await User.findById(userId).select("following followers").lean();

  const followingSet = new Set(user.following.map((id) => id.toString()));
  const followersSet = new Set(user.followers.map((id) => id.toString()));

  // --- Fetch rooms where user is a member ---
  const rooms = await Room.find({
    parentCommunity: communityId,
    "members.user": userId,
  })
    .populate("createdBy", "username profilePicture.url")
    .populate("linkedTrip", "title startDate endDate location")
    .populate({
      path: "members.user",
      select: "username profilePicture.url",
    })
    .sort({ createdAt: -1 })
    .lean();

  // Sort members based on follow priority
  const processedRooms = rooms.map((room) => ({
    ...room,
    members: sortMembers(room.members, followingSet, followersSet),
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { rooms: processedRooms },
        "User rooms in this community fetched"
      )
    );
});

export const getMyRoomsAcrossCommunities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all communities the user belongs to
  const memberships = await CommunityMembership.find({ user: userId })
    .select("community")
    .lean();

  const communityIds = memberships.map((m) => m.community);

  // Fetch rooms where user is a member across all these communities
  const rooms = await Room.find({
    parentCommunity: { $in: communityIds },
    "members.user": userId,
  })
    .select("name backgroundImage.url parentCommunity")
    .populate("parentCommunity", "name")
    .populate("linkedTrip", "title startDate endDate location")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { rooms },
        "All user rooms across communities fetched"
      )
    );
});

export const getSuggestedRooms = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const memberships = await CommunityMembership.find({ user: userId }).lean();

  const communityIds = memberships.map((m) => m.community);

  const rooms = await Room.aggregate([
    {
      $match: {
        parentCommunity: { $in: communityIds },
        "members.user": { $ne: userId },
      },
    },
    {
      $addFields: {
        memberCount: { $size: "$members" },
      },
    },
    {
      $sort: { memberCount: -1 },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { rooms }, "Suggested rooms fetched"));
});

export const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  // Fetch room
  const room = await Room.findById(roomId).select("parentCommunity members");
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  // Ensure user is in the community of the room
  const membership = await CommunityMembership.findOne({
    community: room.parentCommunity,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only community members can join this room");
  }

  // Check if already a member
  const isAlreadyMember = room.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (isAlreadyMember) {
    throw new ApiError(409, "Already a member of this room");
  }

  // Add user to room
  room.members.push({
    user: userId,
    role: "member",
    joinedAt: new Date(),
  });
  await room.save();

  // Add room to user's list
  await User.findByIdAndUpdate(userId, {
    $addToSet: { rooms: roomId },
  });

  // Fetch joining user info
  const userData = await User.findById(userId)
    .select("username profilePicture.url")
    .lean();

  // Socket event (broadcast to room)
  io.to(roomId.toString()).emit("userJoinedRoom", {
    roomId,
    user: userData,
    joinedAt: new Date(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { user: userData }, "Joined room successfully"));
});

export const leaveRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const memberIndex = room.members.findIndex(
    (m) => m.user.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new ApiError(404, "You are not a member");
  }

  if (room.members[memberIndex].role === "owner") {
    throw new ApiError(
      400,
      "Owner cannot leave. Transfer ownership or delete room"
    );
  }

  room.members.splice(memberIndex, 1);
  await room.save();

  // Update user rooms
  await User.findByIdAndUpdate(userId, {
    $pull: { rooms: roomId },
  });

  // Emit to room
  io.to(roomId.toString()).emit("memberLeftRoom", { roomId, userId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Left room successfully"));
});

export const sendRoomMessage = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  const { content = "", gifUrl } = req.body;

  const file = req.files?.media?.[0];

  // room exists?
  const room = await Room.findById(roomId).select("members parentCommunity");
  if (!room) throw new ApiError(404, "Room not found");

  // user is member?
  const isMember = room.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) throw new ApiError(403, "Only room members can send messages");

  // empty message?
  if (!content && !gifUrl && !file) {
    throw new ApiError(400, "Message must contain text, media, or GIF");
  }

  const messageData = {
    room: roomId,
    sender: userId,
    content: content.trim(),
    type: "text",
  };

  // file upload handling
  if (file) {
    const uploaded = await uploadRoomMedia(file, roomId);

    messageData.type = uploaded.mimeType.startsWith("image/")
      ? "image"
      : uploaded.mimeType.startsWith("video/")
      ? "video"
      : "document";

    messageData.media = uploaded;
  }

  // gif handling
  if (gifUrl) {
    messageData.type = "gif";
    messageData.media = { url: gifUrl };
  }

  const message = await MessageInRoom.create(messageData);

  await message.populate("sender", "username profilePicture.url");

  // SOCKET: send real-time update to room
  io.to(roomId.toString()).emit("room:newMessage", message);

  return res.status(201).json(new ApiResponse(201, message, "Message sent"));
});

export const getRoomMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const { page = 1, limit = 50, before } = req.query;

  const room = await Room.findById(roomId).select("members");
  if (!room) throw new ApiError(404, "Room not found");

  const isMember = room.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) throw new ApiError(403, "Only members can view messages");

  const query = { room: roomId };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await MessageInRoom.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate("sender", "username profilePicture.url")
    .lean();

  // reverse to chronological order
  messages.reverse();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages,
        hasMore: messages.length === parseInt(limit),
        nextCursor: messages.length ? messages[0].createdAt : null,
      },
      "Messages fetched"
    )
  );
});

export const reactToRoomMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji?.trim()) throw new ApiError(400, "Emoji is required");

  const message = await MessageInRoom.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const room = await Room.findById(message.room).select("members");
  const isMember = room.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) throw new ApiError(403, "Only members can react");

  const existing = message.reactions.find(
    (r) => r.emoji === emoji && r.by.toString() === userId.toString()
  );

  let updated;

  if (existing) {
    updated = await MessageInRoom.findByIdAndUpdate(
      messageId,
      { $pull: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  } else {
    updated = await MessageInRoom.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  }

  // SOCKET UPDATE
  io.to(message.room.toString()).emit("room:reactionUpdated", {
    messageId,
    reactions: updated.reactions,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updated.reactions,
        existing ? "Reaction removed" : "Reaction added"
      )
    );
});

export const deleteRoomMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await MessageInRoom.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const room = await Room.findById(message.room).select("members");
  if (!room) throw new ApiError(404, "Room not found");

  const member = room.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  if (!member) throw new ApiError(403, "You are not a member");

  const isSender = message.sender.toString() === userId.toString();
  const isModerator = ["owner", "moderator"].includes(member.role);

  if (!isSender && !isModerator) {
    throw new ApiError(403, "Only sender or moderator can delete messages");
  }

  // Delete cloud media if exists
  if (message.media?.publicId) {
    try {
      await cloudinary.uploader.destroy(message.media.publicId);
    } catch (err) {
      console.error("Failed to delete media from cloud:", err);
    }
  }

  await MessageInRoom.findByIdAndDelete(messageId);

  // SOCKET: message deleted event
  io.to(message.room.toString()).emit("room:messageDeleted", {
    messageId,
    roomId: message.room.toString(),
  });

  return res.status(200).json(new ApiResponse(200, {}, "Message deleted"));
});
