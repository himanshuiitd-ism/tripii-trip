// for sunday ai plan confirmation

export default function ConfirmActionModal({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-[360px] rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>

        <p className="mt-2 text-sm text-gray-600">{description}</p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
