import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createCommunity,
  deleteCommunity,
  getCommunityProfile,
  getUserCommunities,
  searchCommunities,
  suggestedCommunities,
  updateCommunitySettings,
} from "../controllers/community/community.controller.js";
import {
  addMembers,
  changeMemberRole,
  getCommunityMembers,
  joinPublicCommunity,
  leaveCommunity,
  removeMember,
  updateDisplayName,
} from "../controllers/community/member.controller.js";
import {
  getActivityTimeline,
  getCommunityActivities,
} from "../controllers/community/activity.controller.js";
import {
  deleteMessage,
  getMessages,
  reactToMessage,
  reportMessage,
  sendMessage,
  togglePinMessage,
  voteOnPoll,
} from "../controllers/community/message.controller.js";
import { markAllAsSeen } from "../controllers/user/notification.controller.js";
import {
  createRoom,
  deleteRoomMessage,
  getCommunityRooms,
  getMyCommunityRooms,
  getMyRoomsAcrossCommunities,
  getRoomMessages,
  getSuggestedRooms,
  joinRoom,
  leaveRoom,
  reactToRoomMessage,
  sendRoomMessage,
} from "../controllers/community/rooms.controller.js";
const router = express.Router();

router.use(verifyJWT);

router.route("/createCommunity").post(createCommunity);
router.route("/communitySetting/:communityId").post(updateCommunitySettings);
router.route("/getCommunityProfile/:communityId").get(getCommunityProfile);
router.route("/getMyCommunities").get(getUserCommunities);
router.route("/searchCommunities").get(searchCommunities);
router.route("/SuggestedCommunities").get(suggestedCommunities);
router.route("/deletecommunity").delete(deleteCommunity);

//controller/community/members.controller.js
router.route("/joinCommunity/:communityId").post(joinPublicCommunity);
router.route("/addMember/:communityId").post(addMembers);
router.route("/removeMember/:communityid").post(removeMember);
router.route("/leaveCommunity/:communityId").post(leaveCommunity);
router.route("/changeMemberRole/:communityId").post(changeMemberRole);
router.route("/getCommunityMembers/:communityId").get(getCommunityMembers);
router.route("/updateMyDisplaName/:communityId").post(updateDisplayName);

//activity.controller.js
router.route("/CommunityActivity/:communityId").get(getCommunityActivities);
router.route("/ActivityTimeline/:communityId").get(getActivityTimeline);

//message.controller.js
router.route("/sendCommMess/:communityId").post(sendMessage);
router.route("/getMessageIncomm/:communityId").get(getMessages);
router.route("/reactOnMessage/:messageId").post(reactToMessage);
router.route("/deleteMessage/:messageId").delete(deleteMessage);
router.route("/pinMessage/:messageId").post(togglePinMessage);
router.route("/vote/:messageId").post(voteOnPoll);
router.route("/markAsSeen/:messageId").post(markAllAsSeen);
router.route("/reportMessage/:messageId").post(reportMessage);

//room.controller.js
router.route("/createRoom/:communityId").post(createRoom);
router.route("/getCommunityRooms/:communityId").get(getCommunityRooms);
router.route("/myRoom/:communityId").get(getMyCommunityRooms);
router.route("/allMyRooms").get(getMyRoomsAcrossCommunities);
router.route("/suggestedRoom").get(getSuggestedRooms);
router.route("/joinRoom/:roomId").post(joinRoom);
router.route("/leaveRoom/:roomId").post(leaveRoom);
router.route("/:roomId/sendMessage").post(sendRoomMessage);
router.route("/:roomId/RoomMessage").get(getRoomMessages);
router.route("/:messageId/react").post(reactToRoomMessage);
router.route("/:messageId/deleteMessage").delete(deleteRoomMessage);
export default router;
