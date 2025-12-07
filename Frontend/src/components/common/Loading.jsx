// src/components/common/Loading.jsx
export default function Loading({ small = false }) {
  return (
    <div
      className={`flex items-center justify-center ${small ? "p-2" : "p-6"}`}
    >
      <div className="animate-spin rounded-full border-4 border-t-transparent border-[#40E0D0] w-8 h-8" />
    </div>
  );
}
