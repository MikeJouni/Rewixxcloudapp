import React, { useState, useEffect } from "react";

const SimpleReceiptModal = ({
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

      await onVerify(receiptDataToSend);
      
      setStatus("✅ Items added successfully!");
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  if (!isOpen || !receiptData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-[95vw] max-h-[95vh] overflow-auto w-[500px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Confirm Receipt Items</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Receipt Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Receipt Total:</span>
              <span className="font-semibold">${receiptData.total?.toFixed(2) || "0.00"}</span>
            </div>
            {receiptData.vendor && (
              <div className="flex justify-between">
                <span>Store:</span>
                <span className="font-semibold">{receiptData.vendor}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items List */}
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

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
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
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-600 text-xs hover:text-red-800"
                >
                  Remove Item
                </button>
              </div>
            ))}
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
            {isProcessing ? "Adding..." : "Add to Job"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleReceiptModal;
