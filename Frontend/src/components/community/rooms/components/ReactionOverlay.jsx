export default function ReactionOverlay({
  reactions,
  myReactions,
  onReact,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-black text-white w-56 max-h-[220px] overflow-y-auto rounded-xl p-3 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">All Reactions</span>
          <button
            onClick={onClose}
            className="hover:bg-white/10 p-1 rounded text-white"
          >
            ✕
          </button>
        </div>
        {reactions.map((r) => {
          const isMine = myReactions.has(r.emoji);

          return (
            <button
              key={r.emoji}
              onClick={() => {
                onReact(r.emoji);
                onClose();
              }}
              className={`
                w-full flex justify-between items-center py-2 px-2 rounded text-sm transition
                ${isMine ? "bg-primary text-white" : "hover:bg-white/10"}
              `}
            >
              <span>{r.emoji}</span>
              <span className="font-semibold text-white">{r.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
