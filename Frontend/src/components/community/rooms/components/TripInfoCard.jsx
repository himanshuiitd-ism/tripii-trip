// components/TripInfoCard.jsx
import { useNavigate } from "react-router-dom";

export default function TripInfoCard({ room }) {
  const navigate = useNavigate();

  if (room.roomtype !== "Trip") return null;

  return (
    <div className="rounded-xl overflow-hidden shadow">
      <div
        className="h-32 bg-cover bg-center"
        style={{ backgroundImage: `url(${room.roombackgroundImage?.url})` }}
      />
      <div className="p-4">
        <p className="font-bold">{room.name}</p>
        <p className="text-xs text-gray-500 mb-2">
          {new Date(room.startDate).toDateString()} →{" "}
          {new Date(room.endDate).toDateString()}
        </p>
        <button
          onClick={() =>
            navigate(room.externalLink?.url || `/trip/${room.linkedTrip}`)
          }
          className="w-full bg-primary py-2 rounded-lg font-semibold"
        >
          Open Trip
        </button>
      </div>
    </div>
  );
}
