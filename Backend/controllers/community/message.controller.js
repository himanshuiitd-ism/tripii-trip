// controllers/community/messages.controller.js
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";

import { Community } from "../../models/community/community.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { MessageInComm } from "../../models/community/messageInComm.model.js";

import { sendNotification } from "../user/notification.controller.js";
import { emitToCommunity, emitToUser } from "../../socket/server.js";

/**
 * Upload media helper
 */
const uploadMedia = async (file, communityId) => {
  const uri = getDataUri(file);

  const result = await cloudinary.uploader.upload(uri.content, {
    folder: `communities/${communityId}/media`,
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

  if (!membership) throw new ApiError(403, "Only members can send messages");

  if (!content && !file && !gifUrl && !poll)
    throw new ApiError(400, "Message must contain text, media, GIF, or poll");

  const messageData = {
    community: communityId,
    sender: userId,
    content: content?.trim() || "",
    senderDisplayName: membership.displayName || req.user.username,
    senderDisplayProfile: req.user.profilePicture?.url || "",
    mentions: Array.isArray(mentions) ? mentions : [],
  };

  // Handle reply
  if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
    const parent = await MessageInComm.findById(replyTo)
      .populate("sender", "username")
      .lean();

    if (parent && parent.community.toString() === communityId) {
      messageData.replyTo = {
        messageId: replyTo,
        senderName:
          parent.senderDisplayName || parent.sender?.username || "Unknown User",
        content: parent.content?.slice(0, 100) || "",
        type: parent.type,
        media:
          parent.type === "image" || parent.type === "gif"
            ? { url: parent.media?.url }
            : null,
      };
    }
  }

  // Poll Message
  if (poll) {
    const {
      question,
      options = [],
      allowMultipleVotes = false,
      expiresInHours = 24,
    } = poll;

    if (!question?.trim()) throw new ApiError(400, "Poll question required");
    if (!Array.isArray(options) || options.length < 2)
      throw new ApiError(400, "Poll needs at least 2 options");

    messageData.type = "poll";
    messageData.poll = {
      question: question.trim(),
      options: options.map((t, i) => ({
        id: i,
        text: t.trim(),
        votes: [],
      })),
      allowMultipleVotes,
      createdBy: userId,
      expiresAt: new Date(Date.now() + (expiresInHours || 24) * 3600 * 1000),
      totalVotes: 0,
    };
  }
  // Image
  else if (file) {
    const uploaded = await uploadMedia(file, communityId);

    messageData.type = uploaded.mimeType.startsWith("image/")
      ? "image"
      : "document";
    messageData.media = uploaded;
  }
  // GIF
  else if (gifUrl) {
    messageData.type = "gif";
    messageData.media = { url: gifUrl };
  }
  // Text
  else {
    messageData.type = "text";
  }

  const message = await MessageInComm.create(messageData);
  await message.populate("sender", "username profilePicture");

  const emitPayload = {
    ...message.toObject(),
    sender: {
      _id: message.sender._id,
      username: message.sender.username,
      profilePicture: message.sender.profilePicture,
      displayName: message.senderDisplayName,
    },
  };

  // Real-time emit
  emitToCommunity(communityId.toString(), "community:message:new", emitPayload);

  return res
    .status(201)
    .json(new ApiResponse(201, emitPayload, "Message sent"));
});

/**
 * GET MESSAGES
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { limit = 50, before } = req.query;

  const member = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });
  if (!member) throw new ApiError(403, "Only members can view messages");

  const query = { community: communityId };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await MessageInComm.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate("sender", "username profilePicture")
    .lean();

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

/**
 * REACT TO MESSAGE
 */
export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji?.trim()) throw new ApiError(400, "Emoji required");

  const message = await MessageInComm.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const member = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });
  if (!member) throw new ApiError(403, "Only members can react");

  const exists = message.reactions.some(
    (r) => r.emoji === emoji && r.by.toString() === userId.toString()
  );

  let updated;
  if (exists) {
    updated = await MessageInComm.findByIdAndUpdate(
      messageId,
      { $pull: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  } else {
    updated = await MessageInComm.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  }

  emitToCommunity(message.community.toString(), "community:message:reaction", {
    messageId,
    reactions: updated.reactions,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updated.reactions,
        exists ? "Reaction removed" : "Reaction added"
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
  if (!message) throw new ApiError(404, "Message not found");

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });
  if (!membership) throw new ApiError(403, "Only members can delete");

  const isSender = message.sender.toString() === userId.toString();
  const isAdmin = membership.role === "admin";
  if (!isSender && !isAdmin)
    throw new ApiError(403, "Only sender or admin can delete");

  if (message.media?.publicId) {
    try {
      await cloudinary.uploader.destroy(message.media.publicId, {
        resource_type: message.media.mimeType?.startsWith("image/")
          ? "image"
          : "raw",
      });
    } catch (err) {
      console.error("Cloudinary deletion failed:", err);
    }
  }

  await MessageInComm.findByIdAndDelete(messageId);

  emitToCommunity(message.community.toString(), "community:message:deleted", {
    messageId,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Message deleted"));
});

/**
 * PIN / UNPIN MESSAGE
 */
export const togglePinMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await MessageInComm.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });
  if (!membership) throw new ApiError(403, "Only members can pin");

  const community = await Community.findById(message.community);

  const isPinned = community.pinnedMessage?.message?.toString() === messageId;

  if (isPinned) {
    community.pinnedMessage = undefined;
    await community.save();

    emitToCommunity(
      message.community.toString(),
      "community:message:unpinned",
      {
        messageId,
      }
    );

    return res.status(200).json(new ApiResponse(200, {}, "Message unpinned"));
  }

  community.pinnedMessage = {
    message: messageId,
    pinnedBy: userId,
    pinnedAt: new Date(),
  };
  await community.save();

  emitToCommunity(message.community.toString(), "community:message:pinned", {
    messageId,
    pinnedBy: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, community.pinnedMessage, "Message pinned"));
});

/**
 * VOTE ON POLL
 */
export const voteOnPoll = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { optionIds } = req.body;
  const userId = req.user._id;

  if (!Array.isArray(optionIds) || !optionIds.length)
    throw new ApiError(400, "Select at least one option");

  const message = await MessageInComm.findById(messageId);
  if (!message || !message.poll) throw new ApiError(404, "Poll not found");

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });
  if (!membership) throw new ApiError(403, "Only members can vote");

  if (message.poll.expiresAt && new Date() > message.poll.expiresAt)
    throw new ApiError(400, "Poll expired");

  const numeric = optionIds.map((n) => parseInt(n));

  // Remove previous votes if single-vote poll
  if (!message.poll.allowMultipleVotes) {
    message.poll.options.forEach((o) => {
      o.votes = (o.votes || []).filter(
        (v) => v.toString() !== userId.toString()
      );
    });
  }

  numeric.forEach((id) => {
    const option = message.poll.options.find((o) => o.id === id);
    if (option) option.votes.push(userId);
  });

  message.poll.totalVotes = message.poll.options.reduce(
    (x, o) => x + o.votes.length,
    0
  );

  message.markModified("poll");
  await message.save();

  emitToCommunity(message.community.toString(), "community:poll:updated", {
    messageId,
    poll: message.poll,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, message.poll, "Vote recorded"));
});

/**
 * MARK MESSAGE SEEN
 */
export const markMessageSeen = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const msg = await MessageInComm.findById(messageId);
  if (!msg) throw new ApiError(404, "Message not found");

  const isSeen = msg.seenBy.some(
    (s) => s.user.toString() === userId.toString()
  );
  if (!isSeen) {
    msg.seenBy.push({ user: userId, seenAt: new Date() });
    await msg.save();
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

  const valid = ["spam", "inappropriate", "harassment", "fake", "other"];
  if (!valid.includes(reason)) throw new ApiError(400, "Invalid reason");

  const msg = await MessageInComm.findById(messageId);
  if (!msg) throw new ApiError(404, "Message not found");

  const membership = await CommunityMembership.findOne({
    community: msg.community,
    user: userId,
  });
  if (!membership) throw new ApiError(403, "Only members can report");

  const exists = msg.reports.some((r) => r.by.toString() === userId.toString());
  if (exists) throw new ApiError(409, "Already reported");

  msg.reports.push({ reason, by: userId });
  await msg.save();

  // notify admins if >=3 reports
  if (msg.reports.length >= 3) {
    const admins = await CommunityMembership.find({
      community: msg.community,
      role: "admin",
    }).select("user");

    admins.forEach((admin) => {
      emitToUser(admin.user.toString(), "community:message:reported", {
        messageId,
        reportCount: msg.reports.length,
      });
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Message reported"));
});
