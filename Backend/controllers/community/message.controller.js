// controllers/community/messages.controller.js
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";
import {
  Community,
  MessageInComm,
  CommunityMembership,
  Activity,
} from "../../models/community.model.js";
import { io } from "../../socket/socket.js";

/**
 * Upload media helper
 */
const uploadMedia = async (file, communityId) => {
  const uri = getDataUri(file);
  const folder = `communities/${communityId}/media`;

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

/**
 * SEND MESSAGE IN COMMUNITY
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { content = "", gifUrl, poll, replyTo, mentions = [] } = req.body;
  const file = req.files?.media?.[0];

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can send messages");
  }

  // Validate: at least one content type
  if (!content && !file && !gifUrl && !poll) {
    throw new ApiError(400, "Message must contain text, media, GIF, or poll");
  }

  const messageData = {
    community: communityId,
    sender: userId,
    content: content?.trim() || "",
    senderDisplayName: membership.displayName || req.user.username,
    senderDisplayProfile: req.user.profilePicture?.url || "",
    mentions: Array.isArray(mentions) ? mentions : [],
  };

  // Handle reply with reference content
  if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
    const parentMessage = await MessageInComm.findById(replyTo)
      .populate("sender", "username")
      .lean();

    if (parentMessage && parentMessage.community.toString() === communityId) {
      messageData.replyTo = {
        messageId: replyTo,
        senderName:
          parentMessage.senderDisplayName ||
          parentMessage.sender?.username ||
          "Unknown",
        content: parentMessage.content?.slice(0, 100) || "", // First 100 chars
        type: parentMessage.type,
        media:
          parentMessage.type === "image" || parentMessage.type === "gif"
            ? { url: parentMessage.media?.url }
            : null,
      };
    }
  }

  // Handle poll
  if (poll) {
    const {
      question,
      options = [],
      allowMultipleVotes = false,
      expiresInHours = 24,
    } = poll;

    if (!question?.trim()) {
      throw new ApiError(400, "Poll question is required");
    }

    if (!Array.isArray(options) || options.length < 2) {
      throw new ApiError(400, "Poll must have at least 2 options");
    }

    messageData.type = "poll";
    messageData.poll = {
      question: question.trim(),
      options: options.map((text, i) => ({
        id: i,
        text: text.trim(),
        votes: [],
      })),
      allowMultipleVotes,
      createdBy: userId,
      expiresAt: new Date(Date.now() + (expiresInHours || 24) * 3600 * 1000),
      totalVotes: 0,
    };
  }
  // Handle media
  else if (file) {
    if (!file.mimetype.startsWith("image/")) {
      throw new ApiError(400, "Only images are allowed");
    }

    const uploaded = await uploadMedia(file, communityId);
    messageData.type = "image";
    messageData.media = uploaded;
  }
  // Handle GIF
  else if (gifUrl) {
    messageData.type = "gif";
    messageData.media = { url: gifUrl };
  }
  // Text only
  else {
    messageData.type = "text";
  }

  const message = await MessageInComm.create(messageData);

  // Populate sender for emission
  await message.populate("sender", "username profilePicture");

  const messageToEmit = {
    ...message.toObject(),
    sender: {
      _id: message.sender._id,
      username: message.sender.username,
      profilePicture: message.sender.profilePicture,
      displayName: message.senderDisplayName,
    },
  };

  io.to(communityId.toString()).emit("newCommunityMessage", messageToEmit);

  return res
    .status(201)
    .json(new ApiResponse(201, messageToEmit, "Message sent"));
});

/**
 * GET COMMUNITY MESSAGES
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 50, before } = req.query;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can view messages");
  }

  const query = { community: communityId };

  // Pagination using cursor (before timestamp)
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await MessageInComm.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate("sender", "username profilePicture")
    .lean();

  // Reverse to get chronological order (oldest first)
  messages.reverse();

  const enrichedMessages = messages.map((msg) => ({
    ...msg,
    senderDisplayName: msg.senderDisplayName || msg.sender?.username,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages: enrichedMessages,
        hasMore: messages.length === parseInt(limit),
        nextCursor: messages.length > 0 ? messages[0].createdAt : null,
      },
      "Messages fetched"
    )
  );
});

/**
 * REACT TO MESSAGE
 */
export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji?.trim()) {
    throw new ApiError(400, "Emoji is required");
  }

  const message = await MessageInComm.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can react");
  }

  const existingReaction = message.reactions.find(
    (r) => r.emoji === emoji && r.by.toString() === userId.toString()
  );

  let updated;
  if (existingReaction) {
    // Remove reaction
    updated = await MessageInComm.findByIdAndUpdate(
      messageId,
      { $pull: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  } else {
    // Add reaction
    updated = await MessageInComm.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  }

  io.to(message.community.toString()).emit("messageReactionUpdate", {
    messageId,
    reactions: updated.reactions,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updated.reactions,
        existingReaction ? "Reaction removed" : "Reaction added"
      )
    );
});

/**
 * DELETE MESSAGE
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await MessageInComm.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "You are not a member");
  }

  const isSender = message.sender.toString() === userId.toString();
  const isAdmin = membership.role === "admin";

  if (!isSender && !isAdmin) {
    throw new ApiError(403, "Only sender or admin can delete");
  }

  // Delete media from cloudinary
  if (message.media?.publicId) {
    try {
      await cloudinary.uploader.destroy(message.media.publicId, {
        resource_type: message.media.mimeType?.startsWith("image/")
          ? "image"
          : "raw",
      });
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  }

  await MessageInComm.findByIdAndDelete(messageId);

  io.to(message.community.toString()).emit("messageDeleted", {
    messageId,
    communityId: message.community.toString(),
  });

  return res.status(200).json(new ApiResponse(200, {}, "Message deleted"));
});

/**
 * PIN/UNPIN MESSAGE
 */
export const togglePinMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await MessageInComm.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can pin");
  }

  // Optional: restrict to admins only
  // if (membership.role !== "admin") {
  //   throw new ApiError(403, "Only admins can pin messages");
  // }

  const community = await Community.findById(message.community);
  const currentPinned = community.pinnedMessage?.message?.toString();

  if (currentPinned === messageId) {
    // Unpin
    community.pinnedMessage = undefined;
    await community.save();

    io.to(message.community.toString()).emit("messageUnpinned", {
      messageId,
      communityId: message.community.toString(),
    });

    return res.status(200).json(new ApiResponse(200, {}, "Message unpinned"));
  } else {
    // Pin
    community.pinnedMessage = {
      message: messageId,
      pinnedBy: userId,
      pinnedAt: new Date(),
    };
    await community.save();

    io.to(message.community.toString()).emit("messagePinned", {
      messageId,
      pinnedBy: userId,
      communityId: message.community.toString(),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, community.pinnedMessage, "Message pinned"));
  }
});

/**
 * VOTE ON POLL
 */
export const voteOnPoll = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { optionIds } = req.body; // array of option IDs
  const userId = req.user._id;

  if (!Array.isArray(optionIds) || optionIds.length === 0) {
    throw new ApiError(400, "Select at least one option");
  }

  const message = await MessageInComm.findById(messageId);
  if (!message || !message.poll) {
    throw new ApiError(404, "Poll not found");
  }

  // Check expiry
  if (message.poll.expiresAt && new Date() > new Date(message.poll.expiresAt)) {
    throw new ApiError(400, "Poll has expired");
  }

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can vote");
  }

  // Check if already voted
  const hasVoted = message.poll.options.some((opt) =>
    (opt.votes || []).some((v) => v.toString() === userId.toString())
  );

  if (hasVoted && !message.poll.allowMultipleVotes) {
    throw new ApiError(400, "You have already voted");
  }

  // Remove previous votes
  message.poll.options.forEach((opt) => {
    opt.votes = (opt.votes || []).filter(
      (v) => v.toString() !== userId.toString()
    );
  });

  // Add new votes
  const numericIds = optionIds.map((id) => parseInt(id));
  numericIds.forEach((id) => {
    const option = message.poll.options.find((o) => o.id === id);
    if (option) {
      option.votes.push(userId);
    }
  });

  // Recalculate total votes
  message.poll.totalVotes = message.poll.options.reduce(
    (sum, opt) => sum + (opt.votes?.length || 0),
    0
  );

  message.markModified("poll");
  await message.save();

  io.to(message.community.toString()).emit("pollUpdated", {
    messageId,
    poll: message.poll,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, message.poll, "Vote recorded"));
});

/**
 * MARK MESSAGE AS SEEN
 */
export const markMessageSeen = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await MessageInComm.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can mark as seen");
  }

  const alreadySeen = message.seenBy.some(
    (s) => s.user.toString() === userId.toString()
  );

  if (!alreadySeen) {
    message.seenBy.push({ user: userId, seenAt: new Date() });
    await message.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Message marked as seen"));
});

/**
 * REPORT MESSAGE
 */
export const reportMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const validReasons = ["spam", "inappropriate", "harassment", "fake", "other"];
  if (!validReasons.includes(reason)) {
    throw new ApiError(400, "Invalid report reason");
  }

  const message = await MessageInComm.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can report");
  }

  const alreadyReported = message.reports.some(
    (r) => r.by.toString() === userId.toString()
  );

  if (alreadyReported) {
    throw new ApiError(409, "You have already reported this message");
  }

  message.reports.push({ reason, by: userId });
  await message.save();

  // Notify admins if threshold reached (e.g., 3 reports)
  if (message.reports.length >= 3) {
    const admins = await CommunityMembership.find({
      community: message.community,
      role: "admin",
    }).select("user");

    admins.forEach((admin) => {
      const socketId = receiverSocketId(admin.user.toString());
      if (socketId) {
        io.to(socketId).emit("messageReported", {
          messageId,
          reportCount: message.reports.length,
        });
      }
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Message reported"));
});
