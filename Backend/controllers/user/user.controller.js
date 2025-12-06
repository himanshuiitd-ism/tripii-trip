import { User } from "../../models/user/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "Username, email and password are required");
  }

  // Check duplicates
  const existing = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });

  if (existing) {
    throw new ApiError(400, "Username or email already exists");
  }

  // Create user
  const user = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    authProviders: [
      { provider: "email", providerId: `email:${email.toLowerCase()}` },
    ],
  });

  // Skip OTP in MVP
  if (process.env.DISABLE_OTP === "true") {
    user.emailVerified = true;
  }

  await user.save();

  const createdUser = await User.findById(user._id).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

export const login = asyncHandler(async (req, res) => {
  console.log("BODY RECEIVED:", req.body);

  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(400, "Identifier and password are required");
  }

  const user = await User.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() },
    ],
  });

  if (!user) throw new ApiError(400, "User not found");

  if (!user.emailVerified && process.env.DISABLE_OTP !== "true") {
    throw new ApiError(403, "Verify your email first");
  }

  const valid = await user.isPasswordcorrect(password);

  if (!valid) throw new ApiError(400, "Incorrect password");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const profile = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: profile,
        accessToken,
        refreshToken,
      },
      "Login successful"
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logout Successfully"));
});
