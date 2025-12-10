import LeftSidebar from "@/components/home/LeftSidebar";
import RightSidebar from "@/components/home/RightSideBar";
import useGetAllPost from "@/hooks/useGetAllPost";
import { Outlet } from "react-router-dom";

const MiniAppLayout = () => {
  const { loading, error } = useGetAllPost();
  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>Error loading posts</p>;
  return (
    <div className="flex w-full">
      {/* LEFT SIDEBAR */}
      <div>
        <LeftSidebar />
      </div>

      {/* CENTER CONTENT */}
      <div>
        <Outlet />
      </div>

      {/* RIGHT SIDEBAR */}
      <div>
        <RightSidebar />
      </div>
    </div>
  );
};

export default MiniAppLayout;
