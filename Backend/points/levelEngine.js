import { LEVELS } from "./levelConfig";

export function recalcLevel(xp) {
  const xpPerSub = LEVELS.xpPerSublevel;
  const totalSublevels = LEVELS.sublevels;

  const totalSubs = Math.floor(xp / xpPerSub);
  const level = Math.min(totalSubs + 1, LEVELS.tiers.length * 10);
  const subLevel = (totalSubs % 10 || 0) + 1;

  const remaining = xp % xpPerSub;
  const levelProgress = Math.floor((remaining / xpPerSub) * 100);

  const nextLevelXP = xpPerSub - remaining;

  return { level, subLevel, levelProgress, nextLevelXP };
}
