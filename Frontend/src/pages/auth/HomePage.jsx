import Feed from "@/components/home/Feed";
import useGetAllPost from "@/hooks/useGetAllPost";
import { useSelector } from "react-redux";

export default function HomePage() {
  const user = useSelector((s) => s.auth.user);

  if (!user) return <p>Please log in to view posts.</p>;

  return (
    <>
      <Feed />
    </>
  );
}
