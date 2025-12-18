export const ROOM_STATUS_META = {
  upcoming: {
    label: "Upcoming",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  active: {
    label: "Active",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.12)",
  },
  finished: {
    label: "Finished",
    color: "#64748B",
    bg: "rgba(100, 116, 139, 0.12)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.12)",
  },
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
