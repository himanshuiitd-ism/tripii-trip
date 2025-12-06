import rateLimit from "express-rate-limit";

// Limit to 5 requests per 15 minutes for profile edits
export const profileEditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: "Too many profile update attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit to 20 requests per hour for general user routes
export const userApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Too many requests from this IP, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting configuration (add this to your rateLimit.middleware.js)
export const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Allow 10 post creations per hour per user
  message: "Too many post creations, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
