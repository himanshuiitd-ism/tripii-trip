import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createTrip,
  getAllUserTripData,
} from "../controllers/trip/trip.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/createTrip", upload.single("coverPhoto"), createTrip);

router.get("/myTrips/data", getAllUserTripData);

export default router;
