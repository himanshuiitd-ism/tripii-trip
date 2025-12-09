// src/components/layout/Navbar.jsx
import { useSelector } from "react-redux";
import profileimage from "../../public/profile.avif";
import { Bell, MessageSquare } from "lucide-react";

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);

  console.log("user:", user);

  return (
    <div className="navbar">
      {/* Left Logo */}
      <div className="navbar-left">
        <div className="navbar-logo">TripiiTrip</div>
      </div>

      {/* Middle Navigation */}
      <div className="navbar-middle">
        <button>Home</button>
        <button>Communities</button>
        <button>Trips</button>
        <button>Places</button>
        <button>Marketplace</button>
      </div>

      {/* Right Side */}
      <div className="navbar-right">
        <button className="icon-btn">
          <Bell size={22} />
        </button>

        <button className="icon-btn">
          <MessageSquare size={22} />
        </button>

        <button className="navbar-profile">
          <img src={user?.profilePicture?.url || profileimage} alt="profile" />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
