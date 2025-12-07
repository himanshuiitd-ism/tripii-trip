import FeedList from "@/components/home/FeedList";
import LeftSidebar from "@/components/home/LeftSideBar";
import RightSidebar from "@/components/home/RightSideBar";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_20rem] gap-6 p-4">
      <LeftSidebar />
      <main className="min-w-0">
        <FeedList />
      </main>
      <RightSidebar />
    </div>
  );
}
