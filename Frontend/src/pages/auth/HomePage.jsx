// src/pages/auth/HomePage.jsx
import Feed from "@/components/home/Feed";
import LeftSidebar from "@/components/home/LeftSidebar";
import RightSideBar from "@/components/home/RightSideBar";
import useGetAllPost from "@/hooks/useGetAllPost";
import { useSelector } from "react-redux";

const HomePage = () => {
  const { loading, error } = useGetAllPost();
  const user = useSelector((s) => s.auth.user);

  if (!user) return <p>Please log in to view posts.</p>;
  if (loading) return <p>Loading posts...</p>;
  if (error)
    return (
      <p style={{ color: "red" }}>
        Error: {error} <button onClick={() => window.location.reload()} />
      </p>
    );

  return (
    <div className="homepage-container">
      <LeftSidebar />

      <div className="feed-wrapper">
        <Feed />
      </div>

      <RightSideBar />
    </div>
  );
};

export default HomePage;
