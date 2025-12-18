import { ACTIVITY_CONFIG } from "../common/activityConfig";

const ActivityItem = ({ a }) => {
  const cfg = ACTIVITY_CONFIG[a.type] || {
    label: a.type,
    emoji: "❓",
    color: "bg-gray-400",
  };
  // Add this function at the top of ActivityItem component
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);

    // Time format: HH:MM
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const time = `${hours}:${minutes}`;

    // Date format: 18 Dec 2025
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    const dateFormatted = `${day} ${month} ${year}`;

    return `${time} • ${dateFormatted}`;
  };
  return (
    <div className="flex gap-3 relative">
      {/* Emoji */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm ${cfg.color}`}
      >
        {cfg.emoji}
      </div>

      {/* Content */}
      <div className="flex flex-col">
        <p className="text-sm font-medium">{cfg.label}</p>
        <p className="text-xs text-text-muted-light">
          {a.actor?.username || "Someone"} • {formatDateTime(a.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
