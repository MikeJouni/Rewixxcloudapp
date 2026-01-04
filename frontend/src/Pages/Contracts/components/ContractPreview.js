import React from "react";
import { Card, Empty } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import config from "../../../config";

const ContractPreview = ({ data, accountSettings, isMobile = false, materials = [] }) => {
  if (!data) {
    return (
      <Card
        title="Preview"
        className="h-full"
        bodyStyle={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px"
        }}
      >
        <Empty
          image={<FileTextOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
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
    licenseNumber,
    idNumber,
    customerName,
    customerAddress,
    contractNumber,
    date,
    scopeOfWork,
    termsAndConditions,
    totalPrice,
    warranty,
    depositPercent,
    paymentMethods,
    showCostBreakdown,
    showMaterialsList,
  } = data;

  const depositAmount = (totalPrice * depositPercent) / 100;
  const remainingAmount = totalPrice - depositAmount;
  const logoUrl = accountSettings?.logoUrl;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Card title="Live Preview" className="h-full" size={isMobile ? "small" : "default"}>
      <div
        style={{
          padding: isMobile ? "16px" : "40px",
          background: "#fff",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: isMobile ? "11px" : "12px",
          lineHeight: "1.6",
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          maxWidth: "100%",
        }}
      >
        {/* Header with Logo and Company Info */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "center" : "flex-start",
          gap: isMobile ? "16px" : "0",
          marginBottom: isMobile ? "16px" : "24px",
          paddingBottom: "16px",
          borderBottom: "2px solid #333",
          textAlign: isMobile ? "center" : "left",
        }}>
          {/* Logo Section */}
          <div style={{ flex: "0 0 auto" }}>
            {logoUrl ? (
              <img
                src={`${config.SPRING_API_BASE}${logoUrl}`}
                alt="Company Logo"
                style={{ maxHeight: "80px", maxWidth: "200px", objectFit: "contain" }}
              />
            ) : (
              <div style={{
                width: "120px",
                height: "60px",
                border: "1px dashed #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: "10px"
              }}>
                [Company Logo]
              </div>
            )}
          </div>

          {/* Company Info */}
          <div style={{ textAlign: isMobile ? "center" : "right" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: isMobile ? "16px" : "18px", fontWeight: "bold", color: "#333" }}>
              {companyName || "[Company Name]"}
            </h2>
            {companyAddress && <div style={{ color: "#555" }}>{companyAddress}</div>}
            {companyPhone && <div style={{ color: "#555" }}>Phone: {companyPhone}</div>}
            {companyEmail && <div style={{ color: "#555" }}>Email: {companyEmail}</div>}
            {licenseNumber && <div style={{ color: "#555" }}>License: {licenseNumber}</div>}
            {idNumber && <div style={{ color: "#555" }}>ID: {idNumber}</div>}
          </div>
        </div>

        {/* Contract Title and Number */}
        <div style={{ textAlign: "center", margin: isMobile ? "16px 0" : "24px 0" }}>
          <h1 style={{
            margin: "0",
            fontSize: isMobile ? "20px" : "28px",
            fontWeight: "bold",
            letterSpacing: isMobile ? "1px" : "2px",
            color: "#222"
          }}>
            SERVICE CONTRACT
          </h1>
          <div style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
            Contract No: <strong>{contractNumber || "[Auto-generated]"}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Date: {formatDate(date)}
          </div>
        </div>

        {/* Parties Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? "16px" : "24px",
          margin: isMobile ? "16px 0" : "24px 0",
          padding: isMobile ? "12px" : "16px",
          background: "#f9f9f9",
          borderRadius: "4px"
        }}>
          <div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: isMobile ? "12px" : "14px", fontWeight: "bold", color: "#333", borderBottom: "1px solid #ddd", paddingBottom: "4px" }}>
              CONTRACTOR
            </h3>
            <div style={{ fontWeight: "bold" }}>{companyName || "[Company Name]"}</div>
            {companyAddress && <div>{companyAddress}</div>}
            {companyPhone && <div>Phone: {companyPhone}</div>}
            {companyEmail && <div>Email: {companyEmail}</div>}
          </div>
          <div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: isMobile ? "12px" : "14px", fontWeight: "bold", color: "#333", borderBottom: "1px solid #ddd", paddingBottom: "4px" }}>
              CLIENT
            </h3>
            <div style={{ fontWeight: "bold" }}>{customerName || "[Customer Name]"}</div>
            {customerAddress && <div>{customerAddress}</div>}
          </div>
        </div>

        {/* Scope of Work */}
        <div style={{ margin: isMobile ? "16px 0" : "24px 0" }}>
          <h3 style={{
            margin: "0 0 12px 0",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: "bold",
            color: "#333",
            borderBottom: "1px solid #333",
            paddingBottom: "4px"
          }}>
            SCOPE OF WORK
          </h3>
          <div style={{
            whiteSpace: "pre-wrap",
            padding: isMobile ? "8px" : "12px",
            background: "#fafafa",
            border: "1px solid #eee",
            borderRadius: "4px",
            minHeight: isMobile ? "40px" : "60px"
          }}>
            {scopeOfWork || "[Description of work to be performed]"}
          </div>
        </div>

        {/* Materials Section - only show if toggle is on and materials exist */}
        {showMaterialsList && materials && materials.length > 0 && (
          <div style={{ margin: isMobile ? "16px 0" : "24px 0" }}>
            <h3 style={{
              margin: "0 0 12px 0",
              fontSize: isMobile ? "12px" : "14px",
              fontWeight: "bold",
              color: "#333",
              borderBottom: "1px solid #333",
              paddingBottom: "4px"
            }}>
              MATERIALS
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <th style={{ padding: "8px 0", textAlign: "left", fontWeight: "bold", fontSize: isMobile ? "11px" : "12px" }}>Item</th>
                  <th style={{ padding: "8px 0", textAlign: "right", fontWeight: "bold", fontSize: isMobile ? "11px" : "12px", width: "60px" }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material, index) => (
                  <tr key={material.id || index} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "6px 0", fontSize: isMobile ? "11px" : "12px" }}>{material.name}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", fontSize: isMobile ? "11px" : "12px" }}>{material.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pricing Section */}
        <div style={{ margin: isMobile ? "16px 0" : "24px 0" }}>
          <h3 style={{
            margin: "0 0 12px 0",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: "bold",
            color: "#333",
            borderBottom: "1px solid #333",
            paddingBottom: "4px"
          }}>
            PROJECT COST
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {showCostBreakdown && (
                <tr>
                  <td style={{ padding: "8px 0", borderBottom: "1px solid #ddd" }}>Labor & Materials</td>
                  <td style={{ padding: "8px 0", borderBottom: "1px solid #ddd", textAlign: "right" }}>{formatCurrency(totalPrice)}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "10px 0", fontWeight: "bold", fontSize: isMobile ? "13px" : "14px" }}>TOTAL</td>
                <td style={{ padding: "10px 0", fontWeight: "bold", fontSize: isMobile ? "14px" : "16px", textAlign: "right" }}>{formatCurrency(totalPrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Terms */}
        <div style={{ margin: isMobile ? "16px 0" : "24px 0" }}>
          <h3 style={{
            margin: "0 0 12px 0",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: "bold",
            color: "#333",
            borderBottom: "1px solid #333",
            paddingBottom: "4px"
          }}>
            PAYMENT TERMS
          </h3>
          <div style={{
            padding: isMobile ? "8px" : "12px",
            background: "#fafafa",
            border: "1px solid #eee",
            borderRadius: "4px"
          }}>
            <div style={{ marginBottom: "8px" }}>
              <strong>Deposit ({depositPercent || 50}%):</strong> {formatCurrency(depositAmount)} - Due upon signing
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Balance ({100 - (depositPercent || 50)}%):</strong> {formatCurrency(remainingAmount)} - Due upon completion
            </div>
            {paymentMethods && (
              <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed #ddd" }}>
                <strong>Accepted Payment Methods:</strong><br />
                {paymentMethods}
              </div>
            )}
          </div>
        </div>

        {/* Warranty */}
        {warranty && (
          <div style={{ margin: isMobile ? "16px 0" : "24px 0" }}>
            <h3 style={{
              margin: "0 0 12px 0",
              fontSize: isMobile ? "12px" : "14px",
              fontWeight: "bold",
              color: "#333",
              borderBottom: "1px solid #333",
              paddingBottom: "4px"
            }}>
              WARRANTY
            </h3>
            <div style={{
              padding: isMobile ? "8px" : "12px",
              background: "#fafafa",
              border: "1px solid #eee",
              borderRadius: "4px"
            }}>
              {warranty}
            </div>
          </div>
        )}

        {/* Terms and Conditions - only show if provided */}
        {termsAndConditions && (
          <div style={{ margin: isMobile ? "16px 0" : "24px 0" }}>
            <h3 style={{
              margin: "0 0 12px 0",
              fontSize: isMobile ? "12px" : "14px",
              fontWeight: "bold",
              color: "#333",
              borderBottom: "1px solid #333",
              paddingBottom: "4px"
            }}>
              TERMS AND CONDITIONS
            </h3>
            <div style={{
              padding: isMobile ? "8px" : "12px",
              background: "#fafafa",
              border: "1px solid #eee",
              borderRadius: "4px",
              fontSize: isMobile ? "10px" : "11px",
              whiteSpace: "pre-wrap"
            }}>
              {termsAndConditions}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div style={{
          marginTop: isMobile ? "24px" : "40px",
          paddingTop: isMobile ? "16px" : "24px",
          borderTop: "2px solid #333"
        }}>
          <p style={{ marginBottom: isMobile ? "16px" : "24px", fontStyle: "italic", textAlign: "center", fontSize: isMobile ? "10px" : "inherit" }}>
            By signing below, both parties agree to the terms and conditions outlined in this contract.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "24px" : "48px" }}>
            <div>
              <div style={{ marginBottom: "8px", fontWeight: "bold", fontSize: isMobile ? "11px" : "inherit" }}>CLIENT SIGNATURE</div>
              <div style={{
                borderBottom: "1px solid #333",
                height: isMobile ? "30px" : "40px",
                marginBottom: "8px"
              }}></div>
              <div style={{ fontSize: isMobile ? "10px" : "inherit" }}>
                <span>Name: ___________________</span>
              </div>
              <div style={{ marginTop: "8px", fontSize: isMobile ? "10px" : "inherit" }}>
                <span>Date: ___________________</span>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: "8px", fontWeight: "bold", fontSize: isMobile ? "11px" : "inherit" }}>CONTRACTOR SIGNATURE</div>
              <div style={{
                borderBottom: "1px solid #333",
                height: isMobile ? "30px" : "40px",
                marginBottom: "8px"
              }}></div>
              <div style={{ fontSize: isMobile ? "10px" : "inherit" }}>
                <span>Name: ___________________</span>
              </div>
              <div style={{ marginTop: "8px", fontSize: isMobile ? "10px" : "inherit" }}>
                <span>Date: ___________________</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: isMobile ? "24px" : "32px",
          paddingTop: "16px",
          borderTop: "1px solid #ddd",
          textAlign: "center",
          fontSize: isMobile ? "9px" : "10px",
          color: "#888"
        }}>
          <p style={{ margin: 0 }}>
            Thank you for choosing {companyName || "[Company Name]"}. We appreciate your business.
          </p>
          {companyPhone && <p style={{ margin: "4px 0 0 0" }}>Questions? Call us at {companyPhone}</p>}
        </div>
      </div>
    </Card>
  );
};

export default ContractPreview;
