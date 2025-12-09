import { useSelector } from "react-redux";
import { useState } from "react";

const SidebarSection = ({ title, items }) => {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > 3;
  const visible = expanded ? items : items.slice(0, 3);

  return (
    <div className="ls-card">
      <button className="ls-card-header">
        <h3 className="ls-card-title">{title}</h3>
        <span className="material-symbols-outlined ls-expand-icon">
          expand_more
        </span>
      </button>

      <div className="ls-card-body">
        {items.length === 0 && <p className="ls-empty">Currently empty</p>}

        {items.length > 0 && (
          <ul className="ls-list">
            {visible.map((item, i) => (
              <li key={i} className="ls-item">
                {item.name || item.title || item}
              </li>
            ))}
          </ul>
        )}

        {hasMore && !expanded && (
          <button className="ls-more" onClick={() => setExpanded(true)}>
            Show more
          </button>
        )}

        {hasMore && expanded && (
          <button className="ls-more" onClick={() => setExpanded(false)}>
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

const LeftSidebar = () => {
  const { user } = useSelector((store) => store.auth);

  return (
    <aside className="leftsidebar">
      <div className="ls-inner">
        <SidebarSection title="My Rooms" items={user.rooms || []} />

        <SidebarSection title="My Trips" items={user.trips || []} />

        <SidebarSection
          title="Suggested Trips"
          items={user.communities || []}
        />

        <SidebarSection title="My Communities" items={user.communities || []} />

        <SidebarSection title="Suggested Rooms" items={[]} />

        <SidebarSection title="Suggested Communities" items={[]} />
      </div>
    </aside>
  );
};

export default LeftSidebar;
