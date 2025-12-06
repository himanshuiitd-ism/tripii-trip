import { awardPoints } from "./awardPoints.js";

export function getPoints(userId, activity, meta = {}) {
  return awardPoints(userId, activity, meta);
}
