import React from "react";
import { Card, Empty } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import config from "../../../config";

const InvoicePreview = ({ data, accountSettings, isMobile = false }) => {
  if (!data || !data.customerName) {
    return (
      <Card
        title="Preview"
        className="h-full"
        bodyStyle={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <Empty
          image={
            <FileTextOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
          }
          description="Fill in the form to see preview"
        />
      </Card>
    );
  }

  const {
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    logoUrl,
    customerName,
    customerAddress,
    customerEmail,
    customerPhone,
    invoiceNumber,
    invoiceDate,
    dueDate,
    paymentTerms,
    lineItems,
    subtotal,
    taxAmount,
    grandTotal,
    includeTax,
    notes,
    scopeOfWork,
    showItemizedList = true, // Default to true for backwards compatibility
  } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Professional dark color scheme
  const colors = {
    primary: "#1f2937",      // Dark gray
    secondary: "#374151",    // Medium gray
    accent: "#111827",       // Near black
    text: "#1f2937",
    textLight: "#6b7280",
    border: "#e5e7eb",
    background: "#f9fafb",
  };

  return (
    <Card title="Live Preview" className="h-full" size={isMobile ? "small" : "default"}>
      <div
        style={{
          padding: isMobile ? "16px" : "40px",
          background: "#fff",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: isMobile ? "11px" : "12px",
          lineHeight: "1.6",
          border: `1px solid ${colors.border}`,
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          maxWidth: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "center" : "flex-start",
            gap: isMobile ? "16px" : "0",
            marginBottom: isMobile ? "24px" : "32px",
            paddingBottom: "16px",
            borderBottom: `2px solid ${colors.primary}`,
            textAlign: isMobile ? "center" : "left",
          }}
        >
          {/* Logo and Company Info */}
          <div>
            {logoUrl ? (
              <img
                src={`${config.SPRING_API_BASE}${logoUrl}`}
                alt="Company Logo"
                style={{
                  maxHeight: "60px",
                  maxWidth: "180px",
                  objectFit: "contain",
                  marginBottom: "8px",
                }}
              />
            ) : (
              <div
                style={{
                  width: "120px",
                  height: "50px",
                  border: `1px dashed ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.textLight,
                  fontSize: "10px",
                  marginBottom: "8px",
                }}
              >
                [Logo]
              </div>
            )}
            <div style={{ fontWeight: "bold", fontSize: "16px", color: colors.text }}>
              {companyName || "[Company Name]"}
            </div>
            {companyAddress && (
              <div style={{ color: colors.textLight }}>{companyAddress}</div>
            )}
            {companyPhone && (
              <div style={{ color: colors.textLight }}>Phone: {companyPhone}</div>
            )}
            {companyEmail && (
              <div style={{ color: colors.textLight }}>Email: {companyEmail}</div>
            )}
          </div>

          {/* Invoice Title */}
          <div style={{ textAlign: isMobile ? "center" : "right" }}>
            <h1
              style={{
                margin: "0 0 8px 0",
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: "bold",
                color: colors.primary,
                letterSpacing: "2px",
              }}
            >
              INVOICE
            </h1>
            {invoiceNumber && (
              <div style={{ fontSize: isMobile ? "12px" : "14px", color: colors.textLight }}>
                #{invoiceNumber}
              </div>
            )}
          </div>
        </div>

        {/* Bill To and Invoice Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "16px" : "32px",
            marginBottom: isMobile ? "24px" : "32px",
          }}
        >
          {/* Bill To */}
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "11px",
                color: colors.primary,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Bill To
            </div>
            <div style={{ fontWeight: "bold", fontSize: "14px", color: colors.text }}>
              {customerName}
            </div>
            {customerAddress && <div style={{ color: colors.textLight }}>{customerAddress}</div>}
            {customerPhone && <div style={{ color: colors.textLight }}>Phone: {customerPhone}</div>}
            {customerEmail && <div style={{ color: colors.textLight }}>Email: {customerEmail}</div>}
          </div>

          {/* Invoice Details */}
          <div style={{ textAlign: isMobile ? "left" : "right" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                gap: "8px",
                justifyContent: isMobile ? "start" : "end",
              }}
            >
              <div style={{ textAlign: "left", color: colors.textLight }}>
                Invoice Date:
              </div>
              <div style={{ fontWeight: "bold", color: colors.text }}>{formatDate(invoiceDate)}</div>

              {dueDate && (
                <>
                  <div style={{ textAlign: "left", color: colors.textLight }}>
                    Due Date:
                  </div>
                  <div style={{ fontWeight: "bold", color: colors.text }}>{formatDate(dueDate)}</div>
                </>
              )}

              {paymentTerms && (
                <>
                  <div style={{ textAlign: "left", color: colors.textLight }}>
                    Payment Terms:
                  </div>
                  <div style={{ fontWeight: "bold", color: colors.text }}>{paymentTerms}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Line Items - only show if showItemizedList is true */}
        {showItemizedList && lineItems && lineItems.length > 0 && (
          <>
            {isMobile ? (
              <div style={{ marginBottom: "24px" }}>
                {lineItems.map((item, index) => (
                  <div
                    key={item.key || index}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      background: index % 2 === 0 ? "#fff" : colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "8px", color: colors.text }}>
                      {item.description || "[Item Description]"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: colors.textLight }}>
                      <span>Qty: {item.quantity || 0}</span>
                      <span>@ {formatCurrency(item.unitPrice)}</span>
                      <span style={{ fontWeight: "bold", color: colors.text }}>
                        {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "24px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: colors.primary,
                      color: "#fff",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        width: "50%",
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        width: "12%",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "600",
                        width: "19%",
                      }}
                    >
                      Unit Price
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "600",
                        width: "19%",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr
                      key={item.key || index}
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        background: index % 2 === 0 ? "#fff" : colors.background,
                      }}
                    >
                      <td style={{ padding: "12px", color: colors.text }}>
                        {item.description || "[Item Description]"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", color: colors.text }}>
                        {item.quantity || 0}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", color: colors.text }}>
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: colors.text }}>
                        {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Totals */}
        <div
          style={{
            display: "flex",
            justifyContent: isMobile ? "center" : "flex-end",
            marginBottom: isMobile ? "24px" : "32px",
          }}
        >
          <div style={{ width: isMobile ? "100%" : "250px" }}>
            {/* Only show subtotal if itemized */}
            {showItemizedList && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ color: colors.textLight }}>Subtotal:</span>
                <span style={{ fontWeight: "bold", color: colors.text }}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
            )}
            {includeTax && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ color: colors.textLight }}>Tax (6%):</span>
                <span style={{ fontWeight: "bold", color: colors.text }}>
                  {formatCurrency(taxAmount)}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px",
                background: colors.primary,
                color: "#fff",
                marginTop: "8px",
                borderRadius: "4px",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                Total Cost:
              </span>
              <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        {scopeOfWork && (
          <div
            style={{
              marginBottom: "24px",
              padding: "16px",
              background: colors.background,
              borderRadius: "4px",
              borderLeft: `4px solid ${colors.secondary}`,
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                color: colors.primary,
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "1px",
              }}
            >
              Scope of Work
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: colors.text }}>{scopeOfWork}</div>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div
            style={{
              marginBottom: "24px",
              padding: "16px",
              background: colors.background,
              borderRadius: "4px",
              borderLeft: `4px solid ${colors.textLight}`,
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                color: colors.primary,
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "1px",
              }}
            >
              Notes
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: colors.text }}>{notes}</div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: "32px",
            paddingTop: "16px",
            borderTop: `1px solid ${colors.border}`,
            textAlign: "center",
            fontSize: "11px",
            color: colors.textLight,
          }}
        >
          <p style={{ margin: 0 }}>
            Thank you for your business!
          </p>
          {companyPhone && (
            <p style={{ margin: "4px 0 0 0" }}>
              Questions? Contact us at {companyPhone}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default InvoicePreview;
