import { OAuth2Client } from "google-auth-library";
import { User } from "../../models/user/user.model.js";
import asyncHandler from "../../utils/asyncHandler.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = asyncHandler(async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, sub: googleId } = payload;

    // User must EXIST already
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found. Please signup first to set a password.",
      });
    }

    // Link Google to existing user (if not linked)
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProviders.push({
        provider: "google",
        providerId: googleId,
      });
      await user.save();
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.json({
      success: true,
      user,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Google login failed" });
  }
});
