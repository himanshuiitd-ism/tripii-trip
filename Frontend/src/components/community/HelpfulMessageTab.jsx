import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import CommunityPost from "@/components/community/CommunityPost";

const HelpfulMessages = () => {
  const messages = useSelector((s) => s.community.messages || []);
  const profile = useSelector((s) => s.community.profile);
  const user = useSelector((s) => s.auth.user);

  // Filter messages that:
  // 1. Belong to current community
  // 2. Current user marked as helpful
  const helpfulMessages = useMemo(() => {
    if (!profile?._id || !user?._id) return [];

    return messages.filter((m) => {
      // Check if message belongs to current community
      const msgCommunityId = String(m.community?._id || m.community || "");
      const isInCurrentCommunity = msgCommunityId === String(profile._id);

      if (!isInCurrentCommunity) return false;

      // Check if current user marked this message as helpful
      if (!Array.isArray(m.helpful)) return false;

      return m.helpful.some((h) =>
        typeof h === "string"
          ? h === user._id
          : h?.user?.toString() === user._id.toString()
      );
    });
  }, [messages, profile?._id, user?._id]);

  return (
    <div className="flex flex-col gap-6">
      {helpfulMessages.length > 0 ? (
        helpfulMessages.map((m) => <CommunityPost key={m._id} post={m} />)
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="material-symbols-outlined text-6xl text-text-muted-light mb-4">
            recommend
          </span>
          <h3 className="text-lg font-semibold text-text-light mb-2">
            No Helpful Messages Yet
          </h3>
          <p className="text-text-muted-light max-w-md">
            Mark messages as helpful to save them here for easy reference. Just
            click the up arrow on any message you find useful!
          </p>
        </div>
      )}
    </div>
  );
};

export default HelpfulMessages;
