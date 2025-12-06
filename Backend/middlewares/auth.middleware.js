import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Better token extraction with proper error handling
    let token = req.cookies?.accessToken;

    // If no cookie token, check Authorization header
    if (!token) {
      const authHeader = req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "").trim();
      }
    }

    if (!token) {
      throw new ApiError(401, "Access token is required");
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken || !decodedToken._id) {
      throw new ApiError(401, "Invalid token structure");
    }

    // Find user
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "User not found - Invalid access token");
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    // Handle JWT specific errors
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token");
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    } else if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(401, "Authentication failed");
    }
  }
});
