import React from "react";

const ConfirmModal = ({
  isOpen,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmButtonClass = "bg-red-500 hover:bg-red-600",
  requireTextMatch = null, // { expected: string, placeholder?: string, help?: string }
}) => {
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) setInputValue("");
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = !requireTextMatch || inputValue === requireTextMatch.expected;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 m-0">{title}</h3>
          <button
            onClick={onCancel}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {typeof message === "string" ? (
          <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
        ) : (
          message
        )}

        {requireTextMatch && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {requireTextMatch.help || "Type the required text to confirm"}
            </p>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={requireTextMatch.placeholder || requireTextMatch.expected}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`px-4 py-2 text-white rounded ${confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;


