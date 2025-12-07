import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import { createPost } from "@/api/post";

export default function CreatePostBox({ onCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const onFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return alert("Add text or media");

    const fd = new FormData();
    fd.append("caption", text);
    files.forEach((f) => fd.append("media", f));

    try {
      setLoading(true);
      const res = await createPost(fd);
      onCreated && onCreated(res.data.data.post || res.data.data);
      setText("");
      setFiles([]);
    } catch (err) {
      console.error("Create post failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light p-4">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Create a new post..."
              className="w-full min-h-[72px] p-3 rounded-lg border border-border-light bg-background-light focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2 items-center">
                <label className="p-2 rounded-md hover:bg-primary/10 cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={onFiles}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined">image</span>
                </label>

                <button
                  type="button"
                  className="p-2 rounded-md hover:bg-primary/10"
                >
                  <span className="material-symbols-outlined">ballot</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-text-muted-light mr-3">
                  {files.length > 0 ? `${files.length} file(s)` : ""}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-bold"
                >
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
