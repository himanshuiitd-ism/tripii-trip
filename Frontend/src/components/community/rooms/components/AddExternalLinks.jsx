import { useState } from "react";
import { Trash2 } from "lucide-react";
import { updateRoom } from "@/api/room";
import { setSelectedRoomData } from "@/redux/roomSlice";
import { useDispatch } from "react-redux";

const AddExternalLink = ({ roomId, onClose }) => {
  const [links, setLinks] = useState([{ name: "", url: "" }]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const updateField = (index, key, value) => {
    const copy = [...links];
    copy[index][key] = value;
    setLinks(copy);
  };

  const addMore = () => {
    setLinks((prev) => [...prev, { name: "", url: "" }]);
  };

  const removeRow = (index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const payload = links.filter((l) => l.name.trim() && l.url.trim());
    if (!payload.length) return;

    setLoading(true);
    try {
      const res = await updateRoom(roomId, {
        addExternalLinks: payload,
      });
      dispatch(setSelectedRoomData(res.data.data));
      onClose();
    } catch (err) {
      console.error("Failed to add links", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      {/* MODAL */}
      <div className="w-[90vw] max-w-[560px] max-h-[80vh] bg-white rounded-2xl p-5 flex flex-col shadow-xl">
        {/* HEADER */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Links</h3>
          <p className="text-xs text-gray-500">
            Add useful links for everyone in this room
          </p>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Link name"
                value={link.name}
                onChange={(e) => updateField(i, "name", e.target.value)}
                className="w-[35%] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <input
                type="text"
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateField(i, "url", e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {/* DELETE ROW */}
              <button
                onClick={() => removeRow(i)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                title="Remove link"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* ADD MORE */}
        <button
          onClick={addMore}
          className="text-sm text-primary font-semibold mt-3 self-start hover:underline"
        >
          + Add more link
        </button>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-black hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExternalLink;
