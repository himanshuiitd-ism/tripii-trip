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
const router = express.Router();

router.use(verifyJWT);
router.route("/createCommunity").post(createCommunity);
router.route("/communitySetting/:communityId").post(updateCommunitySettings);
router.route("/getCommunityProfile/:communityId").get(getCommunityProfile);
router.route("/getMyCommunities").get(getUserCommunities);
router.route("/searchCommunities").get(searchCommunities);
router.route("/SuggestedCommunities").get(suggestedCommunities);
router.route("/deletecommunity").delete(deleteCommunity);
export default router;
