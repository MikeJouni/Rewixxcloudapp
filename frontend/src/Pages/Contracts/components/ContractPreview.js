import React from "react";
import { Card, Empty } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import config from "../../../config";

const ContractPreview = ({ data, accountSettings }) => {
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
    documentType,
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    licenseNumber,
    idNumber,
    customerName,
    customerAddress,
    date,
    status,
    scopeOfWork,
    totalPrice,
    warranty,
    depositPercent,
    paymentMethods,
  } = data;

  const depositAmount = (totalPrice * depositPercent) / 100;
  const remainingAmount = totalPrice - depositAmount;
  const logoUrl = accountSettings?.logoUrl;

  return (
    <Card title="Live Preview" className="h-full">
      <div
        style={{
          padding: "32px",
          background: "#fff",
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          lineHeight: "1.5",
          border: "1px solid #e8e8e8",
          borderRadius: "4px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {/* Logo */}
        {logoUrl && (
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <img
              src={`${config.SPRING_API_BASE}${logoUrl}`}
              alt="Company Logo"
              style={{ maxHeight: "60px", maxWidth: "180px" }}
            />
          </div>
        )}

        {/* Company Header */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", textTransform: "uppercase" }}>
            {companyName}
          </h2>
          {companyAddress && <div style={{ marginTop: "4px" }}>{companyAddress}</div>}
          {licenseNumber && <div>{licenseNumber}</div>}
          {companyPhone && <div>Phone: {companyPhone}</div>}
          {companyEmail && <div>Email: {companyEmail}</div>}
          {idNumber && <div>ID Number: {idNumber}</div>}
        </div>

        {/* Document Title */}
        <div style={{ textAlign: "center", margin: "20px 0 16px" }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
            {documentType === "invoice" ? "INVOICE" : "CONTRACT"}
          </h1>
        </div>

        {/* Customer Info */}
        <div style={{ marginBottom: "16px" }}>
          <div><strong>Customer Name:</strong> {customerName}</div>
          <div><strong>Address:</strong> {customerAddress}</div>
          <div><strong>Date:</strong> {date}</div>
          <div><strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{status}</span></div>
        </div>

        {/* Scope of Work */}
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px" }}>
            Scope of Work:
          </h3>
          <div style={{ whiteSpace: "pre-wrap", paddingLeft: "8px" }}>
            {scopeOfWork}
          </div>
        </div>

        {/* Total Price */}
        <div style={{ marginBottom: "16px", fontSize: "13px" }}>
          <strong>Total Price (Labor & Materials): ${totalPrice?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</strong>
        </div>

        {/* Warranty */}
        {warranty && (
          <div style={{ marginBottom: "16px" }}>
            <strong>Warranty:</strong> {warranty}
          </div>
        )}

        {/* Payment Terms */}
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px" }}>
            Payment Terms:
          </h3>
          <div style={{ paddingLeft: "8px" }}>
            <div>{depositPercent}% deposit required to start the work: ${depositAmount?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</div>
            <div>Remaining {100 - depositPercent}% due immediately after completion of work: ${remainingAmount?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</div>
          </div>
        </div>

        {/* Payment Methods */}
        {paymentMethods && (
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px" }}>
              Payment Methods Accepted:
            </h3>
            <div style={{ paddingLeft: "8px" }}>
              {paymentMethods}
            </div>
          </div>
        )}

        {/* Signature Line */}
        <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #ddd" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <div>Customer Signature: _______________</div>
              <div style={{ marginTop: "8px" }}>Date: _______________</div>
            </div>
            <div>
              <div>Contractor Signature: _______________</div>
              <div style={{ marginTop: "8px" }}>Date: _______________</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ContractPreview;
