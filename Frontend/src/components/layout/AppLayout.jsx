import { Outlet } from "react-router-dom";
import NavBar from "../home/NavBar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <NavBar />
      <main className="pt-4 px-4 md:px-8 lg:px-16">
        <Outlet />
      </main>
    </div>
  );
}
