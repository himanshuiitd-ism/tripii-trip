import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import RoomMessageItem from "./RoomMessageItem";
import { ChevronDown } from "lucide-react";

export default function RoomChat() {
  const messages = useSelector((s) => s.room.roomMessages);
  const userId = useSelector((s) => s.auth.user?._id);

  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, atBottom]);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    setAtBottom(nearBottom);
  };

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 relative flex flex-col gap-3 p-4 overflow-y-auto"
    >
      {messages.map((m) => (
        <RoomMessageItem
          key={m._id}
          message={m}
          isMine={m.sender?._id === userId}
          containerRef={containerRef}
        />
      ))}

      <div ref={bottomRef} />

      {!atBottom && (
        <button
          onClick={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-black/70 text-white p-2 rounded-full z-50"
        >
          <ChevronDown size={18} />
        </button>
      )}
    </div>
  );
}
