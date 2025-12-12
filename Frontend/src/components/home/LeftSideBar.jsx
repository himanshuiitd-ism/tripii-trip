import { useSelector } from "react-redux";
import { useState } from "react";
import { DoorOpenIcon, LayoutDashboard, Tag, Users } from "lucide-react";

/* ---------- New Community Sidebar Item ---------- */
const CommunitySidebarItem = ({ community }) => {
  const [showTags, setShowTags] = useState(false);

  const tags = community.tags || [];
  const tagCount = tags.length;

  return (
    <div className="ls-community-row">
      {/* IMAGE */}
      <img src={community?.backgroundImage?.url} className="ls-community-img" />

      {/* RIGHT CONTENT */}
      <div className="ls-community-content">
        <p className="ls-community-name">{community.name}</p>

        <div
          className="ls-stats-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "10px",
          }}
        >
          <span
            className="ls-stat"
            style={{ display: "flex", alignItems: "center", gap: "2px" }}
          >
            <Users size={10} strokeWidth={2} /> {community.memberCount}
          </span>
          <span
            className="ls-stat"
            style={{ display: "flex", alignItems: "center", gap: "2px" }}
          >
            <DoorOpenIcon size={10} strokeWidth={2} />{" "}
            {community.roomsLast7DaysCount}
          </span>
          <button
            className="ls-tag-circle"
            onClick={() => setShowTags(true)}
            style={{ display: "flex", alignItems: "center", gap: "2px" }}
          >
            <Tag size={10} strokeWidth={2} />
            {(tagCount > 0 && tagCount) || 0}
          </button>
        </div>
      </div>

      {/* TAG DASHBOARD OVERLAY */}
      {showTags && (
        <div className="ls-tag-dashboard">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Tags</span>
            <button onClick={() => setShowTags(false)}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <span
                key={i}
                className="bg-white/25 px-2 py-1 rounded-md text-[10px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Sidebar Section Component ---------- */
const SidebarSection = ({ title, items }) => {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items?.length > 3;
  const visible = expanded ? items : items?.slice(0, 3);

  return (
    <div className="ls-card">
      <div className="ls-card-header">
        <h3 className="ls-card-title">{title}</h3>
        {hasMore && !expanded && (
          <button className="ls-more" onClick={() => setExpanded(true)}>
            Show
          </button>
        )}
        {hasMore && expanded && (
          <button className="ls-more" onClick={() => setExpanded(false)}>
            Hide
          </button>
        )}
      </div>

      <div className="ls-card-body">
        {items?.length === 0 && <p className="ls-empty">Currently empty</p>}

        {items?.length > 0 && (
          <ul className="ls-list">
            {visible.map((item, i) => (
              <li key={i}>
                {"_id" in item ? (
                  <CommunitySidebarItem community={item} />
                ) : (
                  <div className="ls-item">
                    {item.name || item.title || item}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/* ---------- MAIN SIDEBAR ---------- */
const LeftSidebar = () => {
  const { user } = useSelector((store) => store.auth);
  const { my, suggested } = useSelector((store) => store.community);

  return (
    <aside className="leftsidebar">
      <div className="ls-inner">
        <SidebarSection title="My Rooms" items={user.rooms || []} />

        <SidebarSection title="My Communities" items={my || []} />
        <SidebarSection title="MSuggested Rooms" items={user.rooms || []} />

        <SidebarSection title="Suggested Communities" items={suggested || []} />
      </div>
    </aside>
  );
};

export default LeftSidebar;
