export const EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  ONLINE_USERS: "onlineUsers",

  COMMUNITY_JOIN: "joinCommunity",
  COMMUNITY_LEAVE: "leaveCommunity",
  COMMUNITY_COUNT: "communityOnlineCount",
  COMMUNITY_TYPING: "communityTyping",
  // 🔥 ADD THESE TWO LINES
  MESSAGE_JOIN: "message:join",
  MESSAGE_LEAVE: "message:leave",

  MESSAGE_SEND: "messageSend",
  MESSAGE_RECEIVE: "messageReceive",

  POST_LIKED: "postLiked",
  COMMENT_ADDED: "commentAdded",

  //Rooms
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",

  ROOM_MESSAGE_NEW: "room:message:new",
  ROOM_MESSAGE_DELETED: "room:message:deleted",
  ROOM_REACTION_UPDATED: "room:reaction:updated",
  ROOM_USER_JOINED: "room:userJoined",
};
