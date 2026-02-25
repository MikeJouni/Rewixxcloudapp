import React from "react";

const ReceiptSummary = ({ receiptData, items, missingItems = [] }) => {
  const extractedTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const missingTotal = missingItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const allItemsTotal = extractedTotal + missingTotal;
  const difference = (receiptData.subtotal || 0) - extractedTotal;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <strong>Receipt Summary:</strong>
      <div
        style={{
          fontSize: "0.9rem",
          color: "#666",
          marginTop: "0.5rem",
        }}
      >
        <div>Vendor: {receiptData.vendor}</div>
        <div>Date: {receiptData.date}</div>
        <div>Extracted Items Total: ${extractedTotal.toFixed(2)}</div>
        {missingItems.length > 0 && (
          <div>Added Items Total: ${missingTotal.toFixed(2)}</div>
        )}
        <div>Receipt Subtotal: ${receiptData.subtotal?.toFixed(2)}</div>
        <div>Receipt Tax: ${receiptData.tax?.toFixed(2)}</div>
        <div>Receipt Total: ${receiptData.total?.toFixed(2)}</div>
        <div
          style={{
            fontWeight: "bold",
            color: Math.abs(difference) > 0.01 ? "#e74c3c" : "#27ae60",
            marginTop: "0.25rem",
          }}
        >
          Items vs Subtotal: ${difference.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default ReceiptSummary;
