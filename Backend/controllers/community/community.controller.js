// controllers/community/community.controller.js
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";

import { User } from "../../models/user/user.model.js";
import { Community } from "../../models/community/community.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { Activity } from "../../models/community/activity.model.js";

import { sendNotification } from "../user/notification.controller.js";
import { emitToUser, emitToCommunity } from "../../socket/server.js";

/**
 * Upload cover image to the proper community folder.
 * Returns { url, publicId }.
 */
const uploadCoverImageForCommunity = async (file, communityId) => {
  const uri = getDataUri(file);
  const uploaded = await cloudinary.uploader.upload(uri.content, {
    folder: `communities/${communityId}/cover`,
    transformation: [
      { width: 1200, height: 400, crop: "fill", quality: "auto" },
      { fetch_format: "auto" },
    ],
  });
  return { url: uploaded.secure_url, publicId: uploaded.public_id };
};

/**
 * CREATE COMMUNITY
 */
export const createCommunity = asyncHandler(async (req, res) => {
  const {
    name,
    description = "",
    type = "private_group",
    initialMembers = [],
    settings = {},
  } = req.body;

  const createdBy = req.user._id;

  if (!name?.trim()) throw new ApiError(400, "Community name is required");

  // Validate type
  const validTypes = [
    "private_group",
    "public_group",
    "regional_hub",
    "global_hub",
  ];
  if (!validTypes.includes(type))
    throw new ApiError(400, "Invalid community type");

  // Create community without backgroundImage first (we'll upload after we have the ID)
  const community = await Community.create({
    name: name.trim(),
    description: description.trim(),
    type,
    createdBy,
    backgroundImage: null,
    settings: {
      allowMembersToAdd: settings.allowMembersToAdd !== false,
      allowMemberRooms: settings.allowMemberRooms !== false,
    },
  });

  // ADMIN membership
  const adminMembership = await CommunityMembership.create({
    community: community._id,
    user: createdBy,
    displayName: req.user.username,
    role: "admin",
  });

  const memberDocs = [adminMembership];

  // Add initial members (safe limit)
  if (Array.isArray(initialMembers) && initialMembers.length > 0) {
    // limit to avoid DoS / huge inserts
    const ids = Array.from(new Set(initialMembers)).slice(0, 200);
    // remove creator id if present
    const filtered = ids.filter((id) => id !== createdBy.toString());

    if (filtered.length > 0) {
      const validUsers = await User.find({
        _id: { $in: filtered },
      }).select("_id username");

      if (validUsers.length > 0) {
        const newMemberDocs = validUsers.map((user) => ({
          community: community._id,
          user: user._id,
          displayName: user.username,
          role: "member",
        }));

        const createdMemberships = await CommunityMembership.insertMany(
          newMemberDocs
        );
        memberDocs.push(...createdMemberships);
      }
    }
  }

  // attach membership ids to community and save
  community.members = memberDocs.map((m) => m._id);
  await community.save();

  // Update user.communities for all members
  const userIds = memberDocs.map((m) => m.user);
  if (userIds.length > 0) {
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { communities: community._id } }
    );
  }

  // If cover file was provided, upload it now into the correct folder and update community
  const coverFile = req.files?.coverImage?.[0];
  if (coverFile) {
    try {
      const coverImage = await uploadCoverImageForCommunity(
        coverFile,
        community._id
      );
      community.backgroundImage = coverImage;
      await community.save();
    } catch (err) {
      // Upload failure shouldn't block community creation — log and continue
      console.error("Cover upload failed:", err);
    }
  }

  // Create activity
  const activity = await Activity.create({
    community: community._id,
    actor: createdBy,
    type: "community_created",
    payload: {
      action: "community_created",
      communityName: community.name,
    },
  });

  // Prepare notify list (skip creator)
  const notifyList = memberDocs.filter(
    (m) => m.user.toString() !== createdBy.toString()
  );

  // Send notifications in parallel but don't fail request on single notification error.
  await Promise.allSettled(
    notifyList.map(async (m) => {
      try {
        const notification = await sendNotification({
          recipient: m.user,
          sender: createdBy,
          type: "community_invite",
          message: `${req.user.username} added you to "${community.name}"`,
          community: community._id,
          metadata: {
            communityId: community._id,
            communityName: community.name,
          },
        });

        // If user is online, emit a lightweight real-time event to them (sendNotification also tries to emit)
        try {
          emitToUser(m.user.toString(), "notification:new", notification);
        } catch (emitErr) {
          // non-fatal
        }
      } catch (err) {
        console.error("Notification error for user", m.user.toString(), err);
      }
    })
  );

  // Final populate for response
  const populatedCommunity = await Community.findById(community._id)
    .populate("createdBy", "username profilePicture")
    .populate({
      path: "members",
      populate: { path: "user", select: "username profilePicture" },
    });

  // Broadcast community created event to the community room (members who join that room)
  try {
    emitToCommunity(community._id.toString(), "community:created", {
      community: populatedCommunity,
      activity,
    });
  } catch (err) {
    // non-fatal
    console.error("emitToCommunity failed:", err);
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, populatedCommunity, "Community created successfully")
    );
});

/**
 * UPDATE COMMUNITY SETTINGS
 */
export const updateCommunitySettings = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
    role: "admin",
  });

  if (!membership)
    throw new ApiError(403, "Only admins can update community settings");

  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, "Community not found");

  const { name, description, type, settings } = req.body;

  if (name) community.name = name.trim();
  if (description !== undefined) community.description = description.trim();
  if (
    type &&
    ["private_group", "public_group", "regional_hub", "global_hub"].includes(
      type
    )
  ) {
    community.type = type;
  }

  if (settings && typeof settings === "object") {
    community.settings = { ...community.settings, ...settings };
  }

  // Handle cover image update
  const coverFile = req.files?.coverImage?.[0];
  if (coverFile) {
    if (!coverFile.mimetype.startsWith("image/")) {
      throw new ApiError(400, "Cover must be an image");
    }

    // Delete old cover if exists
    if (community.backgroundImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(community.backgroundImage.publicId);
      } catch (err) {
        console.error("Failed to delete old cover:", err);
      }
    }

    try {
      const newCover = await uploadCoverImageForCommunity(
        coverFile,
        communityId
      );
      community.backgroundImage = newCover;
    } catch (err) {
      console.error("New cover upload failed:", err);
    }
  }

  await community.save();

  // Activity log
  await Activity.create({
    community: communityId,
    actor: userId,
    type: "settings_updated",
    payload: {
      action: "settings_updated",
      changes: { name, description, type, settings },
    },
  });

  // Emit update to community members (real-time)
  try {
    emitToCommunity(communityId.toString(), "community:updated", {
      communityId,
      name: community.name,
      description: community.description,
      backgroundImage: community.backgroundImage,
      settings: community.settings,
    });
  } catch (err) {
    console.error("emitToCommunity error:", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, community, "Community updated successfully"));
});

/**
 * GET COMMUNITY PROFILE
 */
export const getCommunityProfile = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });
  if (!membership)
    throw new ApiError(403, "Only members can view community profile");

  const community = await Community.findById(communityId)
    .populate("createdBy", "username profilePicture bio")
    .populate({
      path: "members",
      populate: { path: "user", select: "username profilePicture bio" },
      options: { limit: 50 },
    })
    .populate("rooms", "name status createdBy tags")
    .populate(
      "featuredTrips",
      "title startDate endDate createdBy type coverPhoto.url"
    )
    .lean();

  if (!community) throw new ApiError(404, "Community not found");

  const memberCount = await CommunityMembership.countDocuments({
    community: communityId,
  });

  community.currentUserRole = membership.role;
  community.totalMembers = memberCount;

  return res
    .status(200)
    .json(new ApiResponse(200, community, "Community profile fetched"));
});

/**
 * GET USER'S COMMUNITIES
 */
export const getUserCommunities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const memberships = await CommunityMembership.find({ user: userId })
    .populate({
      path: "community",
      select: "name description backgroundImage type createdBy members",
      populate: { path: "createdBy", select: "username profilePicture" },
    })
    .lean();

  const communities = memberships
    .filter((m) => m.community)
    .map((m) => ({
      ...m.community,
      userRole: m.role,
      joinedAt: m.createdAt,
      memberCount: m.community.members?.length || 0,
    }));

  return res
    .status(200)
    .json(new ApiResponse(200, communities, "User communities fetched"));
});

/**
 * SEARCH COMMUNITIES
 */
export const searchCommunities = asyncHandler(async (req, res) => {
  const { q, type, page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const query = {};
  if (q?.trim()) query.$text = { $search: q.trim() };
  if (type) query.type = type;
  else query.type = { $in: ["public_group", "regional_hub", "global_hub"] };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const communities = await Community.find(query)
    .select("name description backgroundImage type createdBy members")
    .populate("createdBy", "username profilePicture")
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const communityIds = communities.map((c) => c._id);
  const userMemberships = await CommunityMembership.find({
    community: { $in: communityIds },
    user: userId,
  }).select("community role");

  const membershipMap = new Map(
    userMemberships.map((m) => [m.community.toString(), m.role])
  );

  const enrichedCommunities = communities.map((c) => ({
    ...c,
    isMember: membershipMap.has(c._id.toString()),
    userRole: membershipMap.get(c._id.toString()),
    memberCount: c.members?.length || 0,
  }));

  const total = await Community.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        communities: enrichedCommunities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Communities fetched"
    )
  );
});

/**
 * SUGGESTED COMMUNITIES
 */
export const suggestedCommunities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const myMemberships = await CommunityMembership.find({ user: userId }).select(
    "community"
  );
  const joinedIds = myMemberships.map((m) => m.community);

  const suggestions = await Community.find({
    _id: { $nin: joinedIds },
    type: { $in: ["public_group", "regional_hub", "global_hub"] },
  })
    .select("name description backgroundImage type members")
    .limit(20)
    .lean();

  const enrichedSuggestions = suggestions.map((c) => ({
    ...c,
    memberCount: c.members?.length || 0,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, enrichedSuggestions, "Suggested communities"));
});

/**
 * DELETE COMMUNITY (admin only)
 */
export const deleteCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
    role: "admin",
  });
  if (!membership)
    throw new ApiError(403, "Only admins can delete the community");

  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, "Community not found");

  // Delete cover image
  if (community.backgroundImage?.publicId) {
    try {
      await cloudinary.uploader.destroy(community.backgroundImage.publicId);
    } catch (err) {
      console.error("Failed to delete cover image:", err);
    }
  }

  // Get all members
  const allMembers = await CommunityMembership.find({ community: communityId });
  const memberUserIds = allMembers.map((m) => m.user);

  // Remove community from users
  await User.updateMany(
    { _id: { $in: memberUserIds } },
    { $pull: { communities: communityId } }
  );

  // Delete all memberships
  await CommunityMembership.deleteMany({ community: communityId });

  // Delete all activities
  await Activity.deleteMany({ community: communityId });

  // Delete community
  await Community.findByIdAndDelete(communityId);

  // Notify all members (real-time)
  try {
    emitToCommunity(communityId.toString(), "community:deleted", {
      communityId,
    });
  } catch (err) {
    // fallback per-user emit
    memberUserIds.forEach((memberId) => {
      try {
        emitToUser(memberId.toString(), "community:deleted", { communityId });
      } catch (e) {}
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Community deleted successfully"));
});
