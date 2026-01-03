import { useState } from "react";
import { X } from "lucide-react";
import { createTripPlan } from "@/api/trip";
import { useDispatch } from "react-redux";
import { addTripPlan } from "@/redux/tripSlice";

const CreateTripPlanModal = ({ tripId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    timeStart: "",
    timeEnd: "",
    locationName: "",
    locationAddress: "",
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.date) {
      setError("Title and date are required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: form.title,
        description: form.description || undefined,
        date: form.date,
        time:
          form.timeStart || form.timeEnd
            ? {
                start: form.timeStart || undefined,
                end: form.timeEnd || undefined,
              }
            : undefined,
        location:
          form.locationName || form.locationAddress
            ? {
                name: form.locationName || undefined,
                address: form.locationAddress || undefined,
              }
            : undefined,
      };

      const res = await createTripPlan(tripId, payload);

      dispatch(addTripPlan(res.data.data.plan));

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-base font-bold">Add Activity</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {/* TITLE */}
          <div>
            <label className="text-xs font-medium">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md text-sm"
              placeholder="e.g. Visit Shibuya Crossing"
            />
          </div>

          {/* DATE */}
          <div>
            <label className="text-xs font-medium">Date *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            />
          </div>

          {/* TIME */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Start Time</label>
              <input
                type="time"
                name="timeStart"
                value={form.timeStart}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">End Time</label>
              <input
                type="time"
                name="timeEnd"
                value={form.timeEnd}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-md text-sm"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-xs font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            />
          </div>

          {/* LOCATION */}
          <div>
            <label className="text-xs font-medium">Location</label>
            <input
              name="locationName"
              value={form.locationName}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md text-sm"
              placeholder="Place name"
            />
            <input
              name="locationAddress"
              value={form.locationAddress}
              onChange={handleChange}
              className="w-full mt-2 p-2 border rounded-md text-sm"
              placeholder="Address (optional)"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-9 text-sm font-bold rounded-md bg-teal-400 hover:bg-teal-500 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripPlanModal;
