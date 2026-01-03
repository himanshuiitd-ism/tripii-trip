import { useState } from "react";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";
import { createTrip } from "@/api/trip";
import { addTrip } from "@/redux/tripSlice";

const CreateTripModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "national",
    startDate: "",
    endDate: "",
    city: "",
    state: "",
    country: "",
    visibility: "private",
  });

  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setCoverImage(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("type", formData.type);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      data.append("visibility", formData.visibility);

      // Location fields (backend expects these)
      data.append("city", formData.city.trim());
      data.append("state", formData.state.trim());
      data.append("country", formData.country.trim());

      if (coverImage) data.append("coverPhoto", coverImage);

      for (const [key, value] of data.entries()) {
        console.log(key, value);
      }

      const res = await createTrip(data);

      // Add trip to Redux store
      const newTrip = res.data.data;
      dispatch(addTrip(newTrip));

      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "national",
        startDate: "",
        endDate: "",
        city: "",
        state: "",
        country: "",
        visibility: "private",
      });
      setCoverImage(null);

      // Close modal
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create trip");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Create New Trip</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Trip Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
              placeholder="e.g., Summer Vacation in Japan"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
              placeholder="Tell us about your trip..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Trip Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
              >
                <option value="national">National</option>
                <option value="international">International</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                min={formData.startDate}
                className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
                placeholder="Tokyo"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
                placeholder="Japan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Cover Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 text-xs border border-gray-300 rounded-md focus:ring-teal-400 focus:border-teal-400"
            />
            {coverImage && (
              <p className="text-xs text-gray-600 mt-1">
                Selected: {coverImage.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 px-4 bg-gray-100 text-gray-900 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-9 px-4 bg-teal-400 text-gray-900 text-xs font-bold rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;
