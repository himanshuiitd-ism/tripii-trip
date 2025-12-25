// src/config/activityConfig.js
export const ACTIVITY_CONFIG = {
  community_created: {
    getLabel: () => "Community created",
    emoji: "🌱",
    color: "bg-green-500",
  },
  room_created: {
    getLabel: () => "Room created",
    emoji: "💬",
    color: "bg-blue-500",
  },
  trip_created: {
    getLabel: () => "Trip created",
    emoji: "🧭",
    color: "bg-rose-500",
  },
  poll: {
    getLabel: () => "Poll created",
    emoji: "📊",
    color: "bg-yellow-300",
  },
  member_added: {
    getLabel: () => "Member added",
    emoji: "➕",
    color: "bg-lime-300",
  },
  member_removed: {
    getLabel: () => "Member removed",
    emoji: "➖",
    color: "bg-yellow-600",
    getDescription: (a) =>
      a.payload?.removedUser?.displayName
        ? `${a.payload.removedUser.displayName} was removed from the community`
        : "A member was removed",
  },

  role_changed: {
    getLabel: () => "Role updated",
    emoji: "🥷",
    color: "bg-cyan-300",
    getDescription: (a) => {
      const u = a.payload?.targetUser?.username;
      const from = a.payload?.oldRole;
      const to = a.payload?.newRole;

      if (!u || !from || !to) return "Member role updated";

      return `${u} was changed from ${from} to ${to}`;
    },
  },

  member_joined: {
    getLabel: () => "Member joined",
    emoji: "😶‍🌫️",
    color: "bg-emerald-500",
    getDescription: (a) =>
      a.payload?.username
        ? `${a.payload.username} joined the community`
        : "A new member joined",
  },

  settings_updated: {
    emoji: "⚙️",
    color: "bg-indigo-400",
    getLabel: (a) => {
      const action = a.payload?.action;

      switch (action) {
        case "permissions_updated":
          return "Permissions updated";
        case "name_updated":
          return `Community renamed to "${a.payload?.newName}"`;
        case "rules_updated":
          return `Community rules updated (${
            a.payload?.rulesCount || "multiple"
          } rules)`;
        case "cover_updated":
          return "Community cover photo updated";
        case "description_updated":
          return "Community description updated";
        default:
          return "Community settings updated";
      }
    },
    getDescription: (a) => {
      if (a.payload?.action === "permissions_updated") {
        const changes = a.payload?.changes || {};
        const parts = [];

        if ("allowMemberRooms" in changes) {
          parts.push(
            changes.allowMemberRooms
              ? "enabled member room creation"
              : "disabled member room creation"
          );
        }

        if ("allowMembersToAdd" in changes) {
          parts.push(
            changes.allowMembersToAdd
              ? "allowed members to invite others"
              : "restricted member invites"
          );
        }

        return parts.join(" • ");
      }
      return null;
    },
  },

  message_pinned: {
    getLabel: () => "Message pinned",
    emoji: "📌",
    color: "bg-yellow-300",
    getDescription: (a) =>
      a.payload?.content
        ? `"${a.payload.content.slice(0, 40)}..."`
        : "A message was pinned",
  },
};
