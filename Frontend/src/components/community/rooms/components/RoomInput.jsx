// components/RoomInput.jsx
import { useState } from "react";
import { Image, Smile, X } from "lucide-react";
import GifPickerOverlay from "@/components/common/GifPickerOverlay";

export default function RoomInput({ onSend, sending, room }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [showGif, setShowGif] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSend = () => {
    onSend({ text, file, gifUrl });
    setText("");
    setFile(null);
    setGifUrl(null);
    setPreview(null);
  };

  return (
    <div className="p-2 pb-8 mb-5">
      {/* MEDIA PREVIEW */}
      {(preview || gifUrl) && (
        <div className="mb-2 relative w-fit">
          <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full z-10">
            {gifUrl ? "GIF" : "Image"}
          </span>

          <img
            src={preview || gifUrl}
            className="max-h-40 rounded-lg object-cover"
          />
          <button
            onClick={() => {
              setPreview(null);
              setFile(null);
              setGifUrl(null);
            }}
            className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
          >
            <X size={12} />
          </button>
        </div>
      )}
      {room.status === "finished" ? (
        <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-2">
          Room is finished! You can't message anymore
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent outline-none text-sm"
          />

          {/* IMAGE */}
          <label className="cursor-pointer text-gray-500 hover:text-gray-800">
            <Image size={18} />
            <input type="file" accept="image/*" hidden onChange={handleFile} />
          </label>

          {/* GIF */}
          <button
            onClick={() => setShowGif(true)}
            className="text-gray-500 hover:text-gray-800"
          >
            GIF
          </button>

          <button
            onClick={handleSend}
            disabled={sending}
            className="bg-primary px-4 py-2 rounded-lg font-semibold"
          >
            Send
          </button>
        </div>
      )}

      {showGif && (
        <GifPickerOverlay
          onSelect={(url) => {
            setGifUrl(url);
            setShowGif(false);
          }}
          onClose={() => setShowGif(false)}
        />
      )}
    </div>
  );
}
