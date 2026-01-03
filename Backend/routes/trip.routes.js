import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
  createTrip,
  getAllUserTripData,
} from "../controllers/trip/trip.controller.js";
import {
  addAiTripPlans,
  createTripPlan,
  deleteItineraryPlan,
  // getTripItinerary,
  reorderTripPlans,
  updateItineraryPlan,
} from "../controllers/trip/itinerary.contoller.js";
import {
  deleteTripPhoto,
  downloadTripPhoto,
  getGlobalTripGallery,
  getMyLocalGallery,
  likeTripPhoto,
  pushPhotosToGlobal,
  togglePhotoDownload,
  unlikeTripPhoto,
  uploadTripPhotosBatch,
} from "../controllers/trip/tripGallary.controller.js";

const router = express.Router();

// 🔐 Auth
router.use(verifyJWT);

// ================= TRIP ROUTES =================
router.post("/createTrip", upload.single("coverPhoto"), createTrip);
router.get("/myTrips/data", getAllUserTripData);

// ================= ITINERARY ROUTES =================
// router.get("/trips/:tripId/itinerary", getTripItinerary);
router.post("/trips/:tripId/itinerary", createTripPlan);
router.patch("/trips/:tripId/itinerary/reorder", reorderTripPlans);
router.post("/trips/:tripId/itinerary/ai", addAiTripPlans);
router.patch("/trips/editPlan/:planId", updateItineraryPlan);

router.delete("/trips/deletePlan/:planId", deleteItineraryPlan);

// trip gallary
// ================= TRIP GALLERY ROUTES =================

// 📤 Upload photo (LOCAL by default)
router.post(
  "/trips/:tripId/gallery/upload",
  upload.array("photos", 20),
  uploadTripPhotosBatch
);

// 👤 My local gallery
router.get("/trips/:tripId/gallery/local", getMyLocalGallery);

// 🌍 Global trip gallery
router.get("/trips/:tripId/gallery/global", getGlobalTripGallery);

// 🚀 Push photos to global gallery
router.patch("/trips/:tripId/gallery/push", pushPhotosToGlobal);

// ❤️ Like / Unlike photo
router.post("/trip-gallery/:photoId/like", likeTripPhoto);

router.delete("/trip-gallery/:photoId/like", unlikeTripPhoto);

// ⬇️ Download photo (permission-checked)
router.get("/trip-gallery/:photoId/download", downloadTripPhoto);

// 🔐 Toggle download permission (owner only)
router.patch("/trip-gallery/:photoId/download-permission", togglePhotoDownload);

// 🗑️ Delete photo
router.delete("/trip-gallery/:photoId", deleteTripPhoto);

export default router;
