import React, { useState } from "react";

const ReceiptUploadModal = ({ isOpen, onClose, onAddReceipt, jobId, isProcessing }) => {
  
  const [isMobile] = useState(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      onAddReceipt(file, jobId);
      // Don't close immediately - let the processing state handle it
    }
  };

  const openCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera
    input.onchange = (event) => {
      handleFileSelect(event);
      // Remove element after processing
      document.body.removeChild(input);
    };
    // Force click to trigger camera
    document.body.appendChild(input);
    input.click();
  };

  const openPhotoLibrary = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false; // Prevent multiple selection issues
    input.onchange = (event) => {
      handleFileSelect(event);
      // Remove element after processing
      document.body.removeChild(input);
    };
    // Force click to trigger file picker
    document.body.appendChild(input);
    input.click();
  };


  if (!isOpen) return null;

  // Show processing state
  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Receipt</h2>
            <p className="text-gray-600 text-sm">Please wait while we analyze your receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Receipt</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message */}
          <div className="text-center text-red-600 text-lg font-medium">
            Receipt upload is only supported on mobile devices.
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload Options */}
        <div className="space-y-4">
          <button
            onClick={openCamera}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-3 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take Photo
          </button>

          <button
            onClick={openPhotoLibrary}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-3 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photo Gallery
          </button>

        </div>

        {/* Cancel Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptUploadModal;
