import { useEffect, useMemo, useState } from "react";
import { X, Search, Save } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateRoom } from "@/api/room";
import { setSelectedRoomData } from "@/redux/roomSlice";

export default function RoomSetting({ setSetting }) {
  const dispatch = useDispatch();
  const room = useSelector((s) => s.room.selectedRoomData);
  const currentUserId = useSelector((s) => s.auth.user?._id);

  /* ---------------- STATE ---------------- */
  const [search, setSearch] = useState("");
  const [roleChanges, setRoleChanges] = useState({});
  const [removeMembers, setRemoveMembers] = useState([]);
  const [removeLinks, setRemoveLinks] = useState([]);

  const members = room?.members || [];
  const links = room?.externalLinks || [];

  /* ---------------- ESC CLOSE ---------------- */
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && setSetting(false);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSetting]);

  /* ---------------- FILTER ---------------- */
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (!m?.user?._id) return false;

      // ❌ remove self
      if (m.user._id === currentUserId) return false;

      // 🔍 search filter
      if (!search.trim()) return true;
      return m.user.username?.toLowerCase().includes(search.toLowerCase());
    });
  }, [members, search, currentUserId]);

  /* ---------------- ROLE TOGGLE ---------------- */
  const toggleRole = (member) => {
    if (member.role === "owner") return;

    const uid = member.user?._id;

    setRoleChanges((prev) => {
      const copy = { ...prev };
      if (copy[uid]) delete copy[uid];
      else copy[uid] = member.role === "member" ? "moderator" : "member";
      return copy;
    });
  };

  const submitRoleChanges = async () => {
    if (!Object.keys(roleChanges).length) return;

    const payload = Object.entries(roleChanges).map(([userId, role]) => ({
      userId,
      role,
    }));

    const res = await updateRoom(room?._id, { changeRoles: payload });
    dispatch(setSelectedRoomData(res.data.data));
    setRoleChanges({});
  };

  const submitRemoveMembers = async () => {
    if (!removeMembers.length) return;

    const res = await updateRoom(room?._id, { removeMembers });
    dispatch(setSelectedRoomData(res.data.data));
    setRemoveMembers([]);
  };

  const submitRemoveLinks = async () => {
    if (!removeLinks.length) return;

    const res = await updateRoom(room?._id, {
      removeExternalLinks: removeLinks,
    });
    dispatch(setSelectedRoomData(res.data.data));
    setRemoveLinks([]);
  };

  return (
    /* OVERLAY */
    <div onClick={() => setSetting(false)} style={overlayStyle}>
      {/* MODAL */}
      <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <h3 style={{ fontWeight: 700 }}>Room Settings</h3>
          <X onClick={() => setSetting(false)} style={{ cursor: "pointer" }} />
        </div>

        {/* BODY */}
        <div style={bodyStyle}>
          {/* SEARCH */}
          <div style={{ position: "relative" }}>
            <Search size={16} style={searchIconStyle} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              style={searchInputStyle}
            />
          </div>

          {/* ROLE CHANGE */}
          <Section title="Change Roles">
            {filteredMembers.map((m) => {
              const uid = m.user?._id;
              const active = !!roleChanges[uid];
              const isSelf = m.user._id === currentUserId;

              return (
                <MemberRow
                  key={uid}
                  active={active}
                  disabled={m.role === "owner" || isSelf}
                  onClick={() => toggleRole(m)}
                >
                  <span>{m.user?.username}</span>
                  <span style={rolePill(roleChanges[uid] || m.role)}>
                    {roleChanges[uid] || m.role}
                  </span>
                </MemberRow>
              );
            })}
            <SaveButton onClick={submitRoleChanges} />
          </Section>

          {/* REMOVE MEMBERS */}
          <Section title="Remove Members">
            {filteredMembers
              .filter((m) => m.role !== "owner")
              .map((m) => {
                const uid = m.user?._id;
                const active = removeMembers.includes(uid);

                return (
                  <MemberRow
                    key={uid}
                    active={active}
                    onClick={() =>
                      setRemoveMembers((prev) =>
                        prev.includes(uid)
                          ? prev.filter((x) => x !== uid)
                          : [...prev, uid]
                      )
                    }
                  >
                    <span>{m.user?.username}</span>
                    <input
                      type="checkbox"
                      checked={active}
                      readOnly
                      style={checkboxStyle}
                    />
                  </MemberRow>
                );
              })}
            <SaveButton danger onClick={submitRemoveMembers} />
          </Section>

          {/* REMOVE LINKS */}
          <Section title="Remove External Links">
            {links.map((l) => {
              const active = removeLinks.includes(l.name);
              return (
                <MemberRow
                  key={l.name}
                  active={active}
                  onClick={() =>
                    setRemoveLinks((prev) =>
                      prev.includes(l.name)
                        ? prev.filter((x) => x !== l.name)
                        : [...prev, l.name]
                    )
                  }
                >
                  <span>{l.name}</span>
                  <input
                    type="checkbox"
                    checked={active}
                    readOnly
                    style={checkboxStyle}
                  />
                </MemberRow>
              );
            })}
            <SaveButton danger onClick={submitRemoveLinks} />
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  zIndex: 50,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
};

const modalStyle = {
  width: 680,
  maxHeight: "80vh",
  background: "#fff",
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  animation: "pop 0.2s ease-out",
};

const headerStyle = {
  padding: 16,
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
};

const bodyStyle = {
  padding: 16,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 28,
};

const searchIconStyle = {
  position: "absolute",
  top: 10,
  left: 10,
};

const searchInputStyle = {
  width: "100%",
  padding: "8px 8px 8px 34px",
  borderRadius: 8,
  border: "1px solid #ccc",
};

const checkboxStyle = {
  width: 16,
  height: 16,
  accentColor: "#15f0db",
};

const rolePill = (role) => ({
  padding: "4px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background:
    role === "owner" ? "#e5e7eb" : role === "moderator" ? "#fde68a" : "#e0f2fe",
});

/* ---------------- COMPONENTS ---------------- */

const Section = ({ title, children }) => (
  <div>
    <h4 style={{ fontWeight: 700, marginBottom: 10 }}>{title}</h4>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  </div>
);

const MemberRow = ({ children, active, disabled, onClick }) => (
  <div
    onClick={!disabled ? onClick : undefined}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      background: active ? "rgba(21,240,219,0.15)" : "#fff",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      transition: "all 0.2s ease",
    }}
  >
    {children}
  </div>
);

const SaveButton = ({ onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      marginTop: 10,
      padding: "8px 12px",
      borderRadius: 8,
      background: danger ? "#ff4d4f" : "#15f0db",
      border: "none",
      fontWeight: 600,
      cursor: "pointer",
    }}
  >
    <Save size={14} /> Save
  </button>
);
