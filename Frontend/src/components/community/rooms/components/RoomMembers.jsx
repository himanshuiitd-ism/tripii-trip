// components/RoomMembers.jsx
export default function RoomMembers({ members }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-sm">Travelers ({members.length})</h3>
      {members.map((m) => (
        <div key={m.user._id} className="flex items-center gap-3">
          <img
            src={m.user.profilePicture?.url || "/avatar.png"}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm">{m.user.username}</span>
        </div>
      ))}
    </div>
  );
}
