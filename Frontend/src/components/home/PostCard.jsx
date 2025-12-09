// src/components/home/PostCard.jsx
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleLike, deletePost as apiDeletePost } from "@/api/post";

import { updatePost, removePost } from "@/redux/postSlice";
import { setUserProfile, updateUserStats } from "@/redux/authslice";

import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PostCard = ({ post }) => {
  const dispatch = useDispatch();
  const { user, userProfile } = useSelector((s) => s.auth);

  const author = post.author;
  const profilePic = author?.profilePicture?.url || "/profile.avif";

  // --------------------------
  // LIKE STATE
  // --------------------------
  const isLikedInitially = post.likes.includes(user?._id);
  const [isLiked, setIsLiked] = useState(isLikedInitially);

  // --------------------------
  // MEDIA CAROUSEL STATE
  // --------------------------
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    if (currentIndex < post.media.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // --------------------------
  // LIKE HANDLER
  // --------------------------
  const handleLike = useCallback(async () => {
    if (!user) return console.error("Login required");

    const current = isLiked;
    setIsLiked(!isLiked); // optimistic UI

    try {
      const res = await toggleLike(post._id);
      const data = res.data.data;

      // Update Redux post.likes ONLY
      dispatch(updatePost({ ...post, likes: data.likes }));

      // Update user XP
      if (data.updatedUser) {
        dispatch(setUserProfile(data.updatedUser));
      }
    } catch (err) {
      console.error(err);
      setIsLiked(current); // revert on failure
    }
  }, [user, isLiked, dispatch, post]);

  // --------------------------
  // DELETE HANDLER
  // --------------------------
  const [isDeleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);

    try {
      const res = await apiDeletePost(post._id);

      if (res.data.success) {
        dispatch(removePost(post._id));

        if (res.data.data.updatedUser) {
          dispatch(setUserProfile(res.data.data.updatedUser));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------
  // JSX RENDER
  // --------------------------
  return (
    <div className="postcard">
      {/* -------- HEADER -------- */}
      <div className="postcard-header">
        <img src={profilePic} className="postcard-avatar" />

        <div className="postcard-header-info">
          <p className="postcard-username">{author.username}</p>
          <p className="postcard-time">
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>

        {author._id === user?._id && (
          <button className="postcard-delete-btn" onClick={handleDelete}>
            {isDeleting ? "Deleting..." : <Trash2 size={18} />}
          </button>
        )}
      </div>

      {/* -------- CAPTION -------- */}
      {post.caption && <p className="postcard-caption">{post.caption}</p>}

      {/* -------- MEDIA -------- */}
      {post.media?.length > 0 && (
        <div className="postcard-media-wrapper">
          <img src={post.media[currentIndex].url} className="postcard-media" />

          {currentIndex > 0 && (
            <button className="carousel-arrow left" onClick={prevImage}>
              <ChevronLeft size={32} />
            </button>
          )}

          {currentIndex < post.media.length - 1 && (
            <button className="carousel-arrow right" onClick={nextImage}>
              <ChevronRight size={32} />
            </button>
          )}

          {post.media.length > 1 && (
            <div className="carousel-thumbnails">
              {post.media.map((m, i) => (
                <img
                  key={i}
                  src={m.url}
                  className={`thumb ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------- ACTIONS -------- */}
      <div className="postcard-actions">
        <button className="postcard-action-btn" onClick={handleLike}>
          <Heart size={18} className={isLiked ? "postcard-liked" : ""} />
          <span>{post.likes?.length || 0}</span>
        </button>

        <button className="postcard-action-btn">
          <MessageSquare size={18} />
          <span>{post.comments?.length || 0}</span>
        </button>

        <button className="postcard-action-btn">
          <Bookmark size={18} />
        </button>

        <button className="postcard-action-btn postcard-share">
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
