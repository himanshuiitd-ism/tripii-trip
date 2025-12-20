import { useState } from "react";
import ReactionOverlay from "./ReactionOverlay";

export default function ReactionBar({
  reactions = [],
  myReactions = new Set(),
  onReact,
  containerRef,
}) {
  const [open, setOpen] = useState(false);

  if (!Array.isArray(reactions) || reactions.length === 0) return null;

  const top = reactions.slice(0, 5);
  const extra = reactions.slice(5);

  return (
    <div className="flex gap-1 mt-1 items-center">
      {/* TOP 5 REACTIONS */}
      {top.map((r) => {
        const isMine = myReactions.has(r.emoji);

        return (
          <button
            key={r.emoji}
            onClick={() => onReact(r.emoji)}
            className={`
              flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition
              ${
                isMine
                  ? "bg-primary border border-primary text-white"
                  : "bg-black/60 text-white hover:bg-black/70"
              }
            `}
          >
            <span>{r.emoji}</span>
            <span className="font-semibold">{r.count}</span>
          </button>
        );
      })}

      {/* DOWN ARROW */}
      {extra.length > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="px-2 py-0.5 bg-black/60 text-white text-xs rounded-full hover:bg-black/70"
        >
          ⌄
        </button>
      )}

      {/* OVERLAY */}
      {open && (
        <ReactionOverlay
          reactions={extra}
          myReactions={myReactions}
          onReact={onReact}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
