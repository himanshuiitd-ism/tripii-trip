// src/api/community.js
import axios from "@/api/axios";

/**
 * Community API helpers
 */

export const searchCommunities = (params = {}) =>
  axios.get("/api/community/searchCommunities", { params });

export const getMyCommunities = () =>
  axios.get("/api/community/getMyCommunities");

export const suggestedCommunities = () =>
  axios.get("/api/community/SuggestedCommunities");

export const joinPublicCommunity = (communityId, displayName) =>
  axios.post(`/api/community/joinCommunity/${communityId}`, { displayName });

export const addMembers = (communityId, members = []) =>
  axios.post(`/api/community/addMember/${communityId}`, { members });

export const leaveCommunity = (communityId) =>
  axios.post(`/api/community/leaveCommunity/${communityId}`);

export const getCommunityMembers = (communityId, params = {}) =>
  axios.get(`/api/community/getCommunityMembers/${communityId}`, { params });

export const getCommunityProfile = (communityId) =>
  axios.get(`/api/community/getCommunityProfile/${communityId}`);
