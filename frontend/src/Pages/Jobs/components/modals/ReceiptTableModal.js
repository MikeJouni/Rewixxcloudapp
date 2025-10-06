import React, { useState, useEffect } from "react";

const ReceiptTableModal = ({
  isOpen,
  onClose,
  receiptData,
  onVerify,
  jobId,
}) => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (receiptData) {
      setItems(receiptData.items || []);
      setStatus(""); // Reset any previous status
      setIsProcessing(false); // Reset processing state
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

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        name: "",
        price: 0,
        quantity: 1,
        total: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleVerify = async () => {
    setIsProcessing(true);
    setStatus("Adding items to job...");
    
    try {
      const finalTotal = receiptData.total || 0;

      const receiptDataToSend = {
        receipt_id: `receipt_${Date.now()}`,
        items: items,
        total: finalTotal,
      };

      const result = await onVerify(receiptDataToSend);
      
      if (result && result.success) {
        setStatus("✅ Items added successfully!");
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error("Failed to add items to job");
      }
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  if (!isOpen || !receiptData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-[95vw] max-h-[95vh] overflow-auto w-[800px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Verify Receipt Items</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Receipt Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Receipt Total:</span> ${receiptData.total?.toFixed(2) || "0.00"}
            </div>
            {receiptData.vendor && (
              <div>
                <span className="font-semibold">Store:</span> {receiptData.vendor}
              </div>
            )}
            {receiptData.date && (
              <div>
                <span className="font-semibold">Date:</span> {receiptData.date}
              </div>
            )}
            {receiptData.receipt_number && (
              <div>
                <span className="font-semibold">Receipt #:</span> {receiptData.receipt_number}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {receiptData.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-700 font-medium">{receiptData.error}</span>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Items</h4>
            <button
              onClick={addItem}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Item Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Quantity</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Unit Price</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Total</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="text"
                        value={item.name || ""}
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Item name"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity || 1}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                        step="1"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        value={item.price || 0}
                        onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className="font-semibold">
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status */}
        {status && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
            {status}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={isProcessing || items.length === 0}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Adding..." : "Confirm & Add to Job"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptTableModal;
