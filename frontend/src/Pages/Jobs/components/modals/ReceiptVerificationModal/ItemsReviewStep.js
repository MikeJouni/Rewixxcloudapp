import React from "react";
import ReceiptSummary from "./ReceiptSummary";

const ItemsReviewStep = ({ receiptData, items, onItemChange, onNext }) => {
  return (
    <div>
      <h4 className="text-lg font-semibold mb-4 text-gray-800">Review Items</h4>
      <p className="text-gray-600 mb-4 text-sm">
        Review the items found on your receipt. Make any corrections needed.
      </p>

      <ReceiptSummary receiptData={receiptData} items={items} />

      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "1rem",
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #eee",
              padding: "0.75rem",
              marginBottom: "0.5rem",
              borderRadius: "4px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) => onItemChange(index, "name", e.target.value)}
                placeholder="Item name"
                style={{
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                }}
              />
              <input
                type="number"
                step="0.01"
                value={item.price}
                onChange={(e) => onItemChange(index, "price", e.target.value)}
                placeholder="Price"
                style={{
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                }}
              />
              <input
                type="number"
                step="0.1"
                value={item.quantity}
                onChange={(e) => onItemChange(index, "quantity", e.target.value)}
                placeholder="Qty"
                style={{
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                }}
              />
              <div style={{ fontWeight: "bold" }}>
                ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <button
          onClick={onNext}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Next: Add Missing Items
        </button>
      </div>
    </div>
  );
};

export default ItemsReviewStep;
