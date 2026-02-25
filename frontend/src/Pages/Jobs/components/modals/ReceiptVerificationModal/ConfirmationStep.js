import React from "react";

const ConfirmationStep = ({ 
  receiptData, 
  items, 
  missingItems, 
  status, 
  isProcessing, 
  onPrev, 
  onConfirm 
}) => {
  const allItemsTotal = items.reduce((sum, item) => sum + (item.total || 0), 0) + 
                       missingItems.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div>
      <h4 style={{ marginBottom: "1rem" }}>Confirm Receipt Data</h4>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Final Summary:</strong>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#666",
            marginTop: "0.5rem",
          }}
        >
          <div>Vendor: {receiptData.vendor}</div>
          <div>Date: {receiptData.date}</div>
          <div>Total Items: {items.length + missingItems.length}</div>
          <div>Items Total: ${allItemsTotal.toFixed(2)}</div>
          <div>Receipt Tax: ${receiptData.tax?.toFixed(2) || "0.00"}</div>
          <div style={{ fontWeight: "bold", color: "#27ae60" }}>
            Final Total: ${receiptData.total?.toFixed(2) || "0.00"}
          </div>
        </div>
      </div>

      {/* Show complete list of all items for final review */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>All Items to be Added:</strong>
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "1rem",
            marginTop: "0.5rem",
          }}
        >
          {/* Extracted Items */}
          {items.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h5 style={{ margin: "0 0 0.5rem 0", color: "#3498db" }}>
                Extracted Items ({items.length})
              </h5>
              {items.map((item, index) => (
                <div
                  key={`extracted-${index}`}
                  style={{
                    padding: "0.5rem",
                    marginBottom: "0.25rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "3px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      gap: "0.5rem",
                      alignItems: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{item.name}</div>
                    <div>${item.price?.toFixed(2)}</div>
                    <div>{item.quantity}</div>
                    <div style={{ fontWeight: "bold", color: "#27ae60" }}>
                      ${item.total?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Missing Items */}
          {missingItems.length > 0 && (
            <div>
              <h5 style={{ margin: "0 0 0.5rem 0", color: "#e67e22" }}>
                Added Items ({missingItems.length})
              </h5>
              {missingItems.map((item, index) => (
                <div
                  key={`missing-${index}`}
                  style={{
                    padding: "0.5rem",
                    marginBottom: "0.25rem",
                    backgroundColor: "#fff3cd",
                    borderRadius: "3px",
                    border: "1px solid #ffeaa7",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      gap: "0.5rem",
                      alignItems: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{item.name}</div>
                    <div>${item.price?.toFixed(2)}</div>
                    <div>{item.quantity}</div>
                    <div style={{ fontWeight: "bold", color: "#e67e22" }}>
                      ${item.total?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total Summary */}
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: "#e8f5e8",
              borderRadius: "4px",
              border: "1px solid #c3e6c3",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                gap: "0.5rem",
                alignItems: "center",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ fontWeight: "bold" }}>ITEMS TOTAL:</div>
              <div style={{ fontWeight: "bold", color: "#27ae60" }}>
                ${allItemsTotal.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                gap: "0.5rem",
                alignItems: "center",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
              }}
            >
              <div style={{ fontWeight: "bold" }}>TAX:</div>
              <div style={{ fontWeight: "bold", color: "#e67e22" }}>
                ${receiptData.tax?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                gap: "0.5rem",
                alignItems: "center",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
                borderTop: "1px solid #c3e6c3",
                paddingTop: "0.25rem",
              }}
            >
              <div style={{ fontWeight: "bold" }}>FINAL TOTAL:</div>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#27ae60",
                  fontSize: "1rem",
                }}
              >
                ${receiptData.total?.toFixed(2) || "0.00"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Display */}
      {status && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: status.includes("✅") ? "#d4edda" : status.includes("❌") ? "#f8d7da" : "#d1ecf1",
            border: status.includes("✅") ? "1px solid #c3e6cb" : status.includes("❌") ? "1px solid #f5c6cb" : "1px solid #bee5eb",
            borderRadius: "4px",
            color: status.includes("✅") ? "#155724" : status.includes("❌") ? "#721c24" : "#0c5460",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {status}
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
          disabled={isProcessing}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: isProcessing ? "#bdc3c7" : "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: isProcessing ? "#95a5a6" : "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "Processing..." : "Confirm & Add to Job"}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
