import React from "react";
import ReceiptSummary from "./ReceiptSummary";

const MissingItemsStep = ({ 
  receiptData, 
  items, 
  missingItems, 
  onMissingItemChange, 
  onAddMissingItem, 
  onRemoveMissingItem, 
  onPrev, 
  onNext 
}) => {
  const extractedTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const difference = (receiptData.subtotal || 0) - extractedTotal;

  return (
    <div>
      <h4 style={{ marginBottom: "1rem" }}>Add Missing Items</h4>
      {missingItems.length === 0 ? (
        <div>
          <p
            style={{
              color: "#27ae60",
              marginBottom: "1rem",
              fontWeight: "bold",
            }}
          >
            ✅ Great! All items were extracted correctly. No missing items detected.
          </p>
          <ReceiptSummary receiptData={receiptData} items={items} />
        </div>
      ) : (
        <div>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            If the extracted total doesn't match the receipt total, add the missing items below.
          </p>

          <ReceiptSummary receiptData={receiptData} items={items} missingItems={missingItems} />

          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "1rem",
            }}
          >
            {missingItems.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #eee",
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  borderRadius: "4px",
                  backgroundColor: "#fff3cd",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onMissingItemChange(index, "name", e.target.value)}
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
                    onChange={(e) => onMissingItemChange(index, "price", e.target.value)}
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
                    onChange={(e) => onMissingItemChange(index, "quantity", e.target.value)}
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
                  <button
                    onClick={() => onRemoveMissingItem(index)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#e74c3c",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onAddMissingItem}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "1rem",
            }}
          >
            + Add Missing Item
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1rem",
        }}
      >
        <button
          onClick={onPrev}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Back
        </button>
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
          Next: Confirm
        </button>
      </div>
    </div>
  );
};

export default MissingItemsStep;
