// src/components/GlobalUploadBar.jsx
import { useSelector } from "react-redux";

export default function GlobalUploadBar() {
  const { active, progress, message } = useSelector((s) => s.upload);

  if (!active) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 
                 bg-white shadow-xl rounded-xl px-4 py-3 
                 w-[90%] max-w-md z-[9999]"
    >
      <p className="text-sm font-semibold mb-1">{message}</p>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1">{progress}% completed</p>
    </div>
  );
}
