import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar } from "lucide-react";

/* ---------- HELPERS ---------- */
const formatDate = (start, end) => {
  const opts = { month: "short", day: "numeric", year: "numeric" };
  return `${new Date(start).toLocaleDateString("en-US", opts)} - ${new Date(
    end
  ).toLocaleDateString("en-US", opts)}`;
};

/* ---------- SINGLE TRIP ROW ---------- */
const TripRow = ({ trip, isActive }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/trips/trip/${trip._id}`)}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
        ${
          isActive ? "bg-teal-100 border border-teal-300" : "hover:bg-gray-100"
        }`}
    >
      <img
        src={
          trip.coverPhoto?.url ||
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200"
        }
        alt={trip.title}
        className="w-12 h-12 rounded-md object-cover shrink-0"
      />

      <div className="min-w-0">
        <p
          className={`text-sm font-semibold truncate ${
            isActive ? "text-teal-700" : "text-gray-900"
          }`}
        >
          {trip.title}
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
          <Calendar size={12} />
          <span className="truncate">
            {formatDate(trip.startDate, trip.endDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ---------- SECTION ---------- */
const TripSection = ({ title, trips, activeTripId }) => {
  if (!trips.length) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-700 px-2 pb-2 pt-4">
        {title}
      </h3>
      <div className="space-y-1">
        {trips.map((trip) => (
          <TripRow
            key={trip._id}
            trip={trip}
            isActive={trip._id === activeTripId}
          />
        ))}
      </div>
    </div>
  );
};

/* ---------- MAIN SIDEBAR ---------- */
const TripSidebar = () => {
  const { tripId } = useParams();

  const tripsState = useSelector((s) => s.trip.trips);
  const tripList = tripsState.list
    .map((id) => tripsState.byId[id])
    .filter(Boolean);

  /* ---------- CATEGORIZE ---------- */
  const now = new Date();
  const upcoming = [];
  const ongoing = [];
  const past = [];

  tripList.forEach((trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (end < now) past.push(trip);
    else if (start <= now && end >= now) ongoing.push(trip);
    else upcoming.push(trip);
  });

  return (
    <aside className="h-full overflow-y-auto px-3 py-4 bg-white">
      <h1 className="text-xl font-bold text-gray-900 px-2 mb-4">My Trips</h1>

      <TripSection title="Upcoming" trips={upcoming} activeTripId={tripId} />

      <TripSection title="Ongoing" trips={ongoing} activeTripId={tripId} />

      <TripSection title="Past" trips={past} activeTripId={tripId} />
    </aside>
  );
};

export default TripSidebar;
