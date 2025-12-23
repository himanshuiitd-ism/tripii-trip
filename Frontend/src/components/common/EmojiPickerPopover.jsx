import { useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";

export default function EmojiPickerPopover({ onSelect, onClose }) {
  const ref = useRef(null);

  // ✅ Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="
        absolute z-50 bottom-full mb-2
      "
    >
      <EmojiPicker
        onEmojiClick={(emoji) => onSelect(emoji.emoji)}
        theme="dark"
        skinTonesDisabled
        searchDisabled
        height={320}
        width={300}
      />
    </div>
  );
}
