// src/components/home/FeedList.jsx
import { useEffect, useState } from "react";
import { getFeed } from "@/api/post";
import PostCard from "./PostCard";
import CreatePostBox from "./CreatePostBox";

export default function FeedList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getFeed({ page: 1, limit: 20 });
      // response structure uses ApiResponse wrapper
      const data = res.data?.data?.posts || res.data?.posts || [];
      setPosts(data);
    } catch (err) {
      console.error("Failed to load feed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = (id) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  const handleCreated = (post) => {
    // prepend created post
    setPosts((p) => [post, ...p]);
  };

  if (loading) return <div className="p-4">Loading feed…</div>;

  return (
    <div className="flex flex-col gap-6">
      <CreatePostBox onCreated={handleCreated} />
      <div className="flex flex-col gap-4">
        {posts.length === 0 ? (
          <div className="p-6 text-center bg-surface-light border border-border-light rounded-xl">
            No posts yet
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
