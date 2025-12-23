// ImageViewer.jsx
export default function ImageViewer({ src, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      <img src={src} className="max-w-full max-h-full object-contain" />
    </div>
  );
}
