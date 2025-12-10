// controllers/community/members.controller.js
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  Community,
  CommunityMembership,
  Activity,
} from "../../models/community.model.js";
import { User } from "../../models/user/user.model.js";
import { createNotification } from "../notification.controller.js";
import { io, receiverSocketId } from "../../socket/socket.js";

/**
 * JOIN PUBLIC COMMUNITY
 */
export const joinPublicCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { displayName } = req.body;

  if (!displayName?.trim()) {
    throw new ApiError(400, "Display name is required");
  }

  const community = await Community.findById(communityId);
  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  if (community.type !== "public_group") {
    throw new ApiError(
      403,
      "This is not a public community. You need to be invited by a member."
    );
  }

  const existingMembership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (existingMembership) {
    throw new ApiError(409, "You are already a member");
  }

  const membership = await CommunityMembership.create({
    community: communityId,
    user: userId,
    displayName: displayName.trim(),
    role: "member",
  });

  // Update community members
  await Community.findByIdAndUpdate(communityId, {
    $push: { members: membership._id },
  });

  // Update user communities
  await User.findByIdAndUpdate(userId, {
    $addToSet: { communities: communityId },
  });

  // Create activity
  await Activity.create({
    community: communityId,
    actor: userId,
    type: "member_added",
    payload: {
      userId,
      action: "joined",
    },
  });

  // Emit to community
  io.to(communityId.toString()).emit("memberJoined", {
    membership: await membership.populate("user", "username profilePicture"),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, membership, "Joined community successfully"));
});

/**
 * ADD MEMBERS (by existing members if allowed, or admin)
 * For private communities, members can only be added this way
 */
export const addMembers = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { members = [] } = req.body; // array of user IDs
  const adderId = req.user._id;

  if (!Array.isArray(members) || members.length === 0) {
    throw new ApiError(400, "Members list is required");
  }

  const community = await Community.findById(communityId);
  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  const adderMembership = await CommunityMembership.findOne({
    community: communityId,
    user: adderId,
  });

  if (!adderMembership) {
    throw new ApiError(403, "You must be a member to add others");
  }

  // Check permission: either admin OR community.settings.allowMembersToAdd is true
  if (
    !community.settings?.allowMembersToAdd &&
    adderMembership.role !== "admin"
  ) {
    throw new ApiError(403, "Only admins can add members");
  }

  // Filter out existing members
  const existingMemberships = await CommunityMembership.find({
    community: communityId,
    user: { $in: members },
  }).select("user");

  const existingSet = new Set(
    existingMemberships.map((m) => m.user.toString())
  );
  const toAdd = members.filter((id) => !existingSet.has(id.toString()));

  if (toAdd.length === 0) {
    throw new ApiError(409, "All users are already members");
  }

  // Get valid users
  const users = await User.find({ _id: { $in: toAdd } }).select(
    "username profilePicture"
  );

  if (users.length === 0) {
    throw new ApiError(404, "No valid users found");
  }

  const memberDocs = users.map((user) => ({
    community: communityId,
    user: user._id,
    displayName: user.username,
    role: "member",
  }));

  const createdMemberships = await CommunityMembership.insertMany(memberDocs);

  // Update community
  await Community.findByIdAndUpdate(communityId, {
    $push: { members: { $each: createdMemberships.map((m) => m._id) } },
  });

  // Update users
  const userIds = createdMemberships.map((m) => m.user);
  await User.updateMany(
    { _id: { $in: userIds } },
    { $addToSet: { communities: communityId } }
  );

  // Create activity
  await Activity.create({
    community: communityId,
    actor: adderId,
    type: "member_added",
    payload: {
      addedUsers: userIds,
      count: userIds.length,
    },
  });

  // Send notifications
  await Promise.all(
    createdMemberships.map(async (membership) => {
      try {
        const notification = await createNotification({
          sender: adderId,
          recipient: membership.user,
          type: "community_invite",
          message: `${req.user.username} added you to "${community.name}"`,
        });

        const socketId = receiverSocketId(membership.user.toString());
        if (socketId) {
          io.to(socketId).emit("new_Notification", notification);
        }
      } catch (err) {
        console.error("Notification failed:", err);
      }
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { added: createdMemberships.length },
        "Members added successfully"
      )
    );
});

/**
 * REMOVE MEMBER (admin only)
 */
export const removeMember = asyncHandler(async (req, res) => {
  const { communityId, userId: targetUserId } = req.params;
  const adminId = req.user._id;

  const adminMembership = await CommunityMembership.findOne({
    community: communityId,
    user: adminId,
    role: "admin",
  });

  if (!adminMembership) {
    throw new ApiError(403, "Only admins can remove members");
  }

  if (adminId.toString() === targetUserId) {
    throw new ApiError(400, "You cannot remove yourself");
  }

  const membership = await CommunityMembership.findOneAndDelete({
    community: communityId,
    user: targetUserId,
  });

  if (!membership) {
    throw new ApiError(404, "Member not found");
  }

  // Update community
  await Community.findByIdAndUpdate(communityId, {
    $pull: { members: membership._id },
  });

  // Update user
  await User.findByIdAndUpdate(targetUserId, {
    $pull: { communities: communityId },
  });

  // Create activity
  await Activity.create({
    community: communityId,
    actor: adminId,
    type: "member_removed",
    payload: {
      removedUser: targetUserId,
      action: "removed",
    },
  });

  // Notify removed user
  try {
    const community = await Community.findById(communityId).select("name");
    const notification = await createNotification({
      sender: adminId,
      recipient: targetUserId,
      type: "community_invite",
      message: `You were removed from "${community.name}"`,
    });

    const socketId = receiverSocketId(targetUserId);
    if (socketId) {
      io.to(socketId).emit("new_Notification", notification);
      io.to(socketId).emit("removedFromCommunity", { communityId });
    }
  } catch (err) {
    console.error("Notification failed:", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Member removed successfully"));
});

/**
 * LEAVE COMMUNITY
 */
export const leaveCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(404, "You are not a member of this community");
  }

  // Check if user is the only admin
  if (membership.role === "admin") {
    const adminCount = await CommunityMembership.countDocuments({
      community: communityId,
      role: "admin",
    });

    if (adminCount === 1) {
      throw new ApiError(
        400,
        "You are the only admin. Transfer admin role first or delete the community"
      );
    }
  }

  await CommunityMembership.findByIdAndDelete(membership._id);

  // Update community
  await Community.findByIdAndUpdate(communityId, {
    $pull: { members: membership._id },
  });

  // Update user
  await User.findByIdAndUpdate(userId, {
    $pull: { communities: communityId },
  });

  // Create activity
  await Activity.create({
    community: communityId,
    actor: userId,
    type: "community_left",
    payload: {
      action: "left",
    },
  });

  // Emit to community
  io.to(communityId.toString()).emit("memberLeft", {
    userId,
    communityId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Left community successfully"));
});

/**
 * CHANGE MEMBER ROLE (admin only)
 */
export const changeMemberRole = asyncHandler(async (req, res) => {
  const { communityId, userId: targetUserId } = req.params;
  const { role } = req.body; // "admin" | "member"
  const adminId = req.user._id;

  if (!["admin", "member"].includes(role)) {
    throw new ApiError(400, "Invalid role. Must be 'admin' or 'member'");
  }

  const adminMembership = await CommunityMembership.findOne({
    community: communityId,
    user: adminId,
    role: "admin",
  });

  if (!adminMembership) {
    throw new ApiError(403, "Only admins can change roles");
  }

  if (adminId.toString() === targetUserId) {
    throw new ApiError(400, "You cannot change your own role");
  }

  const membership = await CommunityMembership.findOneAndUpdate(
    { community: communityId, user: targetUserId },
    { role },
    { new: true }
  ).populate("user", "username profilePicture");

  if (!membership) {
    throw new ApiError(404, "Member not found");
  }

  // Create activity
  await Activity.create({
    community: communityId,
    actor: adminId,
    type: "role_changed",
    payload: {
      targetUser: targetUserId,
      newRole: role,
      action: "role_changed",
    },
  });

  // Notify user
  try {
    const community = await Community.findById(communityId).select("name");
    const notification = await createNotification({
      sender: adminId,
      recipient: targetUserId,
      type: "community_invite",
      message: `Your role in "${community.name}" was changed to ${role}`,
    });

    const socketId = receiverSocketId(targetUserId);
    if (socketId) {
      io.to(socketId).emit("new_Notification", notification);
      io.to(socketId).emit("roleUpdated", { communityId, role });
    }
  } catch (err) {
    console.error("Notification failed:", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, membership, "Role updated successfully"));
});

/**
 * GET COMMUNITY MEMBERS
 */
export const getCommunityMembers = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { page = 1, limit = 50, role, search } = req.query;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can view member list");
  }

  const query = { community: communityId };

  // Filter by role
  if (role && ["admin", "member"].includes(role)) {
    query.role = role;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let membersQuery = CommunityMembership.find(query)
    .populate("user", "username profilePicture bio")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const members = await membersQuery;

  // Search filter (post-query, on populated data)
  let filteredMembers = members;
  if (search?.trim()) {
    const searchLower = search.trim().toLowerCase();
    filteredMembers = members.filter(
      (m) =>
        m.user?.username?.toLowerCase().includes(searchLower) ||
        m.displayName?.toLowerCase().includes(searchLower)
    );
  }

  const total = await CommunityMembership.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        members: filteredMembers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Members fetched successfully"
    )
  );
});

/**
 * UPDATE DISPLAY NAME
 * Allows user to change their display name in a community
 */
export const updateDisplayName = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { displayName } = req.body;
  const userId = req.user._id;

  if (!displayName?.trim()) {
    throw new ApiError(400, "Display name is required");
  }

  const membership = await CommunityMembership.findOneAndUpdate(
    { community: communityId, user: userId },
    { displayName: displayName.trim() },
    { new: true }
  ).populate("user", "username profilePicture");

  if (!membership) {
    throw new ApiError(404, "You are not a member of this community");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, membership, "Display name updated successfully")
    );
});
