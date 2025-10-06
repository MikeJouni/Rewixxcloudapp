import React from "react";

const ReceiptLoadingModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[80] p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Receipt</h3>
        <p className="text-gray-600">Please wait while we analyze your receipt...</p>
      </div>
    </div>
  );
};

export default ReceiptLoadingModal;
