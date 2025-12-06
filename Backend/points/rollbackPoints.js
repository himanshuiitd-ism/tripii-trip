// rollbackPointsForModel.js
import { PointsLog } from "../models/user/pointsLog.model.js";
import { User } from "../models/user/user.model.js";
import { recalcLevel } from "./levelEngine.js";

/**
 * Fully rollback all XP & Trust earned from a specific model instance.
 * Example: deleting a post should remove ALL XP user gained from it.
 *
 * @param {String} model - "Post" | "Comment" | "Reel" | "Trip" etc.
 * @param {String} modelId - ObjectId of the deleted model
 */
export async function rollbackPointsForModel(model, modelId) {
  // Fetch all XP logs connected to this model
  const logs = await PointsLog.find({ model, modelId });

  if (!logs || logs.length === 0) return; // nothing to rollback

  // Group XP & Trust to rollback by user
  const grouped = {};

  for (const log of logs) {
    const uid = log.userId.toString();

    if (!grouped[uid]) {
      grouped[uid] = { xp: 0, trust: 0 };
    }

    grouped[uid].xp += log.xp;
    grouped[uid].trust += log.trust;
  }

  // Apply rollback to each affected user
  for (const userId of Object.keys(grouped)) {
    const user = await User.findById(userId);
    if (!user) continue;

    const { xp, trust } = grouped[userId];

    // Remove XP & trust but enforce minimums
    user.xpPoints = Math.max(0, user.xpPoints - xp);
    user.trustScore = Math.max(-20, user.trustScore - trust);

    // Recalculate level after rollback
    const lvl = recalcLevel(user.xpPoints);
    user.level = lvl.level;
    user.subLevel = lvl.subLevel;
    user.levelProgress = lvl.levelProgress;
    user.nextLevelXP = lvl.nextLevelXP;

    await user.save();
  }

  // Delete all logs related to this model to prevent future conflicts
  await PointsLog.deleteMany({ model, modelId });
}
