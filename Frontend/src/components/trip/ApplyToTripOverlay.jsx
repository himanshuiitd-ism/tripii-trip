// for sunday ai plan

import { X, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import styles from "./ApplyToTripOverlay.module.css";
import ConfirmActionModal from "./ConfirmActionModal";

function getTripStatus(trip) {
  if (!trip || trip.isClosed) return "completed";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  end.setHours(23, 59, 59, 999);

  if (end < today) return "completed";
  if (start > today) return "active";

  return "ongoing";
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function canApplyToTrip(trip, userId) {
  if (!trip || !userId) return false;

  const ownerId =
    typeof trip.createdBy === "object" ? trip.createdBy._id : trip.createdBy;

  if (ownerId === userId) return true;

  if (
    Array.isArray(trip.roles) &&
    trip.roles.some(
      (r) =>
        r.role === "planner" &&
        (typeof r.user === "object" ? r.user._id : r.user) === userId
    )
  ) {
    return true;
  }

  return false;
}

export default function ApplyToTripOverlay({ onClose, onSelect }) {
  const userId = useSelector((s) => s.auth.user?._id);
  const tripsById = useSelector((s) => s.trip.trips.byId);
  const tripIds = useSelector((s) => s.trip.trips.list);
  const [confirmTrip, setConfirmTrip] = useState(null);

  const [query, setQuery] = useState("");

  const trips = useMemo(() => {
    return tripIds.map((id) => tripsById[id]).filter(Boolean);
  }, [tripIds, tripsById]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    return trips.filter((t) => {
      const title = t?.title;

      if (!title || typeof title !== "string") return false;

      // empty search → show all
      if (!q) return true;

      return title.toLowerCase().includes(q);
    });
  }, [trips, query]);

  const grouped = useMemo(() => {
    const active = [];
    const ongoing = [];

    filtered.forEach((t) => {
      const status = getTripStatus(t);
      if (status === "active") active.push(t);
      if (status === "ongoing") ongoing.push(t);
    });

    return { active, ongoing };
  }, [filtered]);

  console.log({
    totalTrips: trips.length,
    filtered: filtered.length,
    active: grouped.active.length,
    ongoing: grouped.ongoing.length,
  });

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Apply Plan to Trip</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.search}>
          <Search size={14} />
          <input
            placeholder="Search trips..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {["active", "ongoing"].map((type) => {
          const list = grouped[type];
          if (!list.length) return null;

          return (
            <div key={type} className={styles.section}>
              <h4>{type === "active" ? "Active Trips" : "Ongoing Trips"}</h4>

              {list.map((trip) => {
                const allowed = canApplyToTrip(trip, userId);

                return (
                  <div
                    key={trip._id}
                    className={`${styles.tripCard} ${
                      !allowed ? styles.disabled : ""
                    }`}
                    onClick={() => allowed && setConfirmTrip(trip)}
                  >
                    <img src={trip.coverPhoto?.url} alt="" />

                    <div className={styles.info}>
                      <strong>{trip.title}</strong>
                      <span>
                        {formatDate(trip.startDate)} –{" "}
                        {formatDate(trip.endDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {confirmTrip && (
        <ConfirmActionModal
          title="Apply AI Plan to Trip?"
          description={`This will add all AI-generated activities to "${confirmTrip.title}". You can edit them later.`}
          confirmText="Apply Plan"
          onCancel={() => setConfirmTrip(null)}
          onConfirm={() => {
            onSelect(confirmTrip);
            setConfirmTrip(null);
          }}
        />
      )}
    </div>
  );
}
