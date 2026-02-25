import React, { useState, useEffect } from "react";

const SimpleReceiptVerificationModal = ({
  isOpen,
  onClose,
  receiptData,
  onVerify,
  jobId,
}) => {
  const [items, setItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [missingItems, setMissingItems] = useState([]);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (receiptData) {
      setItems(receiptData.items || []);

      // Calculate if there are missing items by comparing to SUBTOTAL (not total)
      const extractedTotal =
        receiptData.items?.reduce((sum, item) => sum + (item.total || 0), 0) ||
        0;
      const verifySubtotal = receiptData.subtotal || 0;

      // Use Math.abs() to handle floating-point precision issues (-0.00 vs 0.00)
      // Only add missing items if there's a significant difference (more than 1 cent)
      if (Math.abs(extractedTotal - verifySubtotal) > 0.01) {
        setMissingItems([
          {
            id: Date.now(),
            name: "Missing Item",
            price: 0,
            quantity: 1,
            total: verifySubtotal - extractedTotal,
          },
        ]);
        // Start at step 1 if there are missing items
        setCurrentStep(1);
      } else {
        setMissingItems([]);
        // Skip directly to step 3 if no missing items
        setCurrentStep(3);
      }
    }
  }, [receiptData]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]:
        field === "price" || field === "quantity" || field === "total"
          ? parseFloat(value) || 0
          : value,
    };
    setItems(updatedItems);
  };

  const handleMissingItemChange = (index, field, value) => {
    const updatedMissingItems = [...missingItems];
    updatedMissingItems[index] = {
      ...updatedMissingItems[index],
      [field]:
        field === "price" || field === "quantity" || field === "total"
          ? parseFloat(value) || 0
          : value,
    };
    setMissingItems(updatedMissingItems);
  };

  const addMissingItem = () => {
    setMissingItems([
      ...missingItems,
      {
        id: Date.now(),
        name: "",
        price: 0,
        quantity: 1,
        total: 0,
      },
    ]);
  };

  const removeMissingItem = (index) => {
    setMissingItems(missingItems.filter((_, i) => i !== index));
  };

  const handleVerify = async () => {
    setIsProcessing(true);
    setStatus("Processing receipt verification...");
    
    try {
      const allItems = [...items, ...missingItems];
      // Use the receipt total (including tax) as the final total, not just the sum of items
      const finalTotal = receiptData.total || 0;

      setStatus(`Adding ${allItems.length} items to job...`);

      const receiptDataToSend = {
        receipt_id: `receipt_${Date.now()}`,
        items: allItems,
        total: finalTotal,
      };

      // Call onVerify and wait for it to complete
      await onVerify(receiptDataToSend);
      
      setStatus("✅ Materials added successfully! Closing modal...");
      
      // Wait a moment to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (!isOpen || !receiptData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-[95vw] max-h-[95vh] overflow-auto w-[500px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Confirm Receipt</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex mb-6 gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs ${
              currentStep >= 1
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            1. Items
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs ${
              currentStep >= 2
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            2. Missing
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs ${
              currentStep >= 3
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            3. Confirm
          </div>
        </div>

        {/* Step 1: Review Items */}
        {currentStep === 1 && (
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Review Items</h4>
            <p className="text-gray-600 mb-4 text-sm">
              Review the items found on your receipt.
            </p>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <div><strong>Total:</strong> ${receiptData.total?.toFixed(2) || "0.00"}</div>
                {receiptData.vendor && <div><strong>Store:</strong> {receiptData.vendor}</div>}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {items.map((item, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <input
                      type="text"
                      value={item.name || ""}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                      placeholder="Item name"
                    />
                    <input
                      type="number"
                      value={item.quantity || 1}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                      min="1"
                      step="1"
                    />
                    <input
                      type="number"
                      value={item.price || 0}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                    />
                    <div className="px-2 py-1 bg-gray-100 rounded text-center">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add Missing Items */}
        {currentStep === 2 && (
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Add Missing Items</h4>
            <p className="text-gray-600 mb-4 text-sm">
              Add any items that weren't detected automatically.
            </p>

            <div className="space-y-3 mb-6">
              {missingItems.map((item, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <input
                      type="text"
                      value={item.name || ""}
                      onChange={(e) => handleMissingItemChange(index, "name", e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                      placeholder="Item name"
                    />
                    <input
                      type="number"
                      value={item.quantity || 1}
                      onChange={(e) => handleMissingItemChange(index, "quantity", e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                      min="1"
                      step="1"
                    />
                    <input
                      type="number"
                      value={item.price || 0}
                      onChange={(e) => handleMissingItemChange(index, "price", e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                    />
                    <div className="px-2 py-1 bg-gray-100 rounded text-center">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMissingItem(index)}
                    className="mt-2 text-red-600 text-xs hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between mb-6">
              <button
                onClick={addMissingItem}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                + Add Item
              </button>
              <div className="flex gap-2">
                <button
                  onClick={prevStep}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {currentStep === 3 && (
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Confirm & Add</h4>
            <p className="text-gray-600 mb-4 text-sm">
              Review all items and add them to the job.
            </p>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span>Total Items:</span>
                  <span className="font-semibold">{items.length + missingItems.length}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Receipt Total:</span>
                  <span className="font-semibold">${receiptData.total?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>

            {status && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                {status}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={isProcessing}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Add to Job"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleReceiptVerificationModal;
