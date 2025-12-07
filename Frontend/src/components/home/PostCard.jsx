import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import { toggleLike, deletePost as apiDelete } from "@/api/post";

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isOwner = user && post.author && user._id === post.author._id;

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      setLoading(true);
      await apiDelete(post._id);
      onDelete && onDelete(post._id);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await toggleLike(post._id);
      // Simple UX: reload page parent will fetch again; but caller may implement optimistic update
      // For now, reload window or better: emit event. We'll keep it simple.
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <article className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light p-5 relative">
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="absolute top-3 right-3 text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">
                {post.author?.username || "Unknown"}
              </div>
              <div className="text-xs text-text-muted-light">
                {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {post.caption && <p className="mt-3">{post.caption}</p>}

          {post.media?.length > 0 && (
            <div className="mt-3">
              <div
                className="bg-cover bg-center rounded-lg aspect-video"
                style={{ backgroundImage: `url(${post.media[0].url})` }}
              />
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm text-text-muted-light">
            <button onClick={handleLike} className="flex items-center gap-1">
              <span className="material-symbols-outlined">thumb_up</span>
              <span>{post.likes?.length || 0}</span>
            </button>

            <button className="flex items-center gap-1">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span>{post.comments?.length || 0}</span>
            </button>

            <div className="ml-auto text-xs">Share</div>
          </div>
        </div>
      </div>
    </article>
  );
}
