// src/components/community/CommunityTabs.jsx
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";

import DiscussionTab from "./DiscussionTab.jsx";
import MembersTab from "./MembersTab.jsx";
import PinnedMessages from "./PinnedMessages.jsx";
import RoomsTab from "./RoomTab.jsx";
import HelpfulMessages from "./HelpfulMessageTab.jsx";
import CommSetting from "./Setting.jsx";

const CommunityTabs = () => {
  const [active, setActive] = useState("Discussion");

  const role = useSelector((s) => s.community.profile?.currentUserRole);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  /* --------------------------------------------------
     🔐 ROLE-BASED TAB LIST
  -------------------------------------------------- */
  const tabs = useMemo(() => {
    const baseTabs = ["Discussion", "Rooms", "Pins", "Helpfulls", "Members"];

    if (isAdmin || isModerator) {
      baseTabs.push("Setting");
    }

    return baseTabs;
  }, [isAdmin, isModerator]);

  /* --------------------------------------------------
     🔥 SAFETY: AUTO-FALLBACK IF TAB REMOVED
  -------------------------------------------------- */
  React.useEffect(() => {
    if (!tabs.includes(active)) {
      setActive("Discussion");
    }
  }, [tabs, active]);

  return (
    <div className="overflow-hidden">
      {/* -------- TAB BAR -------- */}
      <div className="flex w-full overflow-x-auto no-scrollbar gap-1 p-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-4 py-2 rounded-lg transition ${
              active === t
                ? "bg-primary/10 text-primary font-bold"
                : "text-text-muted-light dark:text-text-muted-dark"
            }`}
          >
            {t}
          </button>
        ))}

        {/* -------- SORT (optional, unchanged) -------- */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted-light font-bold uppercase">
            Sort by:
          </span>
          <button className="text-sm font-bold">
            Hot{" "}
            <span className="material-symbols-outlined !text-[18px]">
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* -------- TAB CONTENT -------- */}
      <div className="p-4">
        {active === "Discussion" && <DiscussionTab />}
        {active === "Rooms" && <RoomsTab />}
        {active === "Pins" && <PinnedMessages />}
        {active === "Members" && <MembersTab />}
        {active === "Helpfulls" && <HelpfulMessages />}

        {(isAdmin || isModerator) && active === "Setting" && <CommSetting />}
      </div>
    </div>
  );
};

export default CommunityTabs;
