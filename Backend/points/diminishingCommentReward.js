import { SpamTracker } from "../models/user/spamTracker.model.js";

export async function getCommentReward(actorId, postId) {
  let record = await SpamTracker.findOne({ userId: actorId, modelId: postId });

  if (!record) {
    // first comment
    await SpamTracker.create({ userId: actorId, modelId: postId, count: 1 });
    return 2; // XP to post owner
  }

  record.count++;
  await record.save();

  if (record.count === 2) return 1;
  if (record.count === 3) return 0.5;
  return 0; // 4th and beyond
}
