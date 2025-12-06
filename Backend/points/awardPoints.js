import { POINTS } from "./pointsConfig.js";
import { recalcLevel } from "./levelEngine.js";
import { User } from "../models/user/user.model.js";
import { PointsLog } from "../models/user/pointsLog.model.js";

export async function awardPoints(userId, activity, meta = {}) {
  const config = POINTS[activity];
  if (!config) return null;

  let xp = config.xp;
  let trust = config.trust;

  if (meta.forceXP !== undefined) {
    // Custom XP override for comment rewards
    xp = meta.forceXP;
  }

  const user = await User.findById(userId);
  if (!user) return null;

  user.xpPoints += xp;
  user.trustScore += trust;

  // level update
  const lvl = recalcLevel(user.xpPoints);
  user.level = lvl.level;
  user.subLevel = lvl.subLevel;
  user.levelProgress = lvl.levelProgress;
  user.nextLevelXP = lvl.nextLevelXP;

  await user.save();

  // log this
  await PointsLog.create({
    userId,
    activity,
    xp,
    trust,
    model: meta.model,
    modelId: meta.modelId,
    actorId: meta.actorId,
  });

  return { xp, trust };
}
