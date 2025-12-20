import { useMemo, useState, useRef } from "react";
import { Smile, Trash2 } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import ImageViewer from "./ImageViewer";
import { useSelector } from "react-redux";
import { reactToRoomMessage, deleteRoomMessage } from "@/api/room";
import { aggregateReactions } from "@/utils/aggregateReactions";
import ReactionBar from "./ReactionBar";

export default function RoomMessageItem({ message, isMine, containerRef }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const bubbleRef = useRef(null);
  const user = useSelector((s) => s.auth.user);

  /* ---------------------------
     MY REACTIONS
  ---------------------------- */
  const myReactions = useMemo(() => {
    if (!Array.isArray(message.reactions) || !user?._id) return new Set();
    return new Set(
      message.reactions.filter((r) => r.by === user._id).map((r) => r.emoji)
    );
  }, [message.reactions, user?._id]);

  /* ---------------------------
     AGGREGATED REACTIONS
  ---------------------------- */
  const aggregatedReactions = useMemo(() => {
    return aggregateReactions(message.reactions);
  }, [message.reactions]);

  /* ---------------------------
     ACTIONS
  ---------------------------- */
  const handleEmojiReact = async (emoji) => {
    try {
      await reactToRoomMessage(message._id, emoji);
      setShowEmoji(false);
    } catch (err) {
      console.error("Room reaction error:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteRoomMessage(message._id);
    } catch (err) {
      console.error("Delete room message error:", err);
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmoji((prev) => !prev);
  };

  return (
    <div className={`group flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}>
      {/* AVATAR */}
      <img
        src={message.sender?.profilePicture?.url || "/public/travel.jpg"}
        className="w-8 h-8 rounded-full"
      />

      <div className="max-w-[70%]">
        {!isMine && (
          <p className="text-xs font-semibold text-primary mb-1">
            {message.sender?.username || "Unknown"}
          </p>
        )}

        {/* MESSAGE BUBBLE */}
        <div
          ref={bubbleRef}
          className="relative bg-white/90 rounded-xl px-4 py-2 shadow"
        >
          {message.content && (
            <p className="text-sm leading-relaxed mb-2 text-gray-900">
              {message.content}
            </p>
          )}

          {message.type === "gif" && message.media?.url && (
            <img
              src={message.media.url}
              className="rounded-lg max-h-60"
              loading="lazy"
            />
          )}

          {message.type === "image" && message.media?.url && (
            <>
              <img
                src={message.media.url}
                onClick={() => setShowImage(true)}
                className="rounded-lg max-h-72 cursor-pointer"
                loading="lazy"
              />
              {showImage && (
                <ImageViewer
                  src={message.media.url}
                  onClose={() => setShowImage(false)}
                />
              )}
            </>
          )}

          {/* HOVER ACTIONS */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2
              ${isMine ? "-left-16" : "-right-12"}
              opacity-0 group-hover:opacity-100
              transition z-20
            `}
          >
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full shadow">
              {/* EMOJI */}
              <button
                onClick={toggleEmojiPicker}
                className="text-gray-600 hover:text-gray-900"
              >
                <Smile size={16} />
              </button>

              {isMine && (
                <button
                  onClick={handleDelete}
                  className="text-gray-600 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* REACTIONS BAR */}
        <ReactionBar
          reactions={aggregatedReactions}
          myReactions={myReactions}
          onReact={handleEmojiReact}
          containerRef={containerRef}
        />
      </div>

      {/* CENTERED EMOJI PICKER OVERLAY */}
      {showEmoji && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
          onClick={() => setShowEmoji(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiClick={(emoji) => handleEmojiReact(emoji.emoji)}
              theme="dark"
              skinTonesDisabled
              searchDisabled
              height={400}
              width={350}
            />
          </div>
        </div>
      )}
    </div>
  );
}
