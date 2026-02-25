import React, { useState } from "react";
import { Card, Empty, Tag, Row, Col, Button, message, Spin, Modal, Descriptions, Typography } from "antd";
import { FileTextOutlined, CalendarOutlined, UserOutlined, DollarOutlined, EyeOutlined, EditOutlined, DownloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ContractList = ({ contracts = [], onEdit, onView, onDownload, isLoading }) => {
  const [selectedContract, setSelectedContract] = useState(null);

  const handleEdit = (contract) => {
    if (onEdit) {
      onEdit(contract);
    } else {
      message.info("Edit functionality coming soon");
    }
  };

  const handleView = (contract) => {
    if (onView) {
      onView(contract);
    } else {
      setSelectedContract(contract);
    }
  };

  const handleDownload = (contract) => {
    if (onDownload) {
      onDownload(contract);
    } else {
      message.info("PDF download functionality coming soon");
    }
  };


  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16, color: "#666" }}>Loading contracts...</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <Empty
        image={<FileTextOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
        description={
          <div>
            <Text type="secondary">No contracts found</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Create your first contract using the button above
            </Text>
          </div>
        }
      />
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        {contracts.map((contract) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={contract.id}>
            <Card
              hoverable
              size="small"
              style={{ height: "100%" }}
              styles={{ body: { padding: "16px", height: "100%", display: "flex", flexDirection: "column" } }}
              onClick={() => handleView(contract)}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <Tag
                  color={contract.documentType === "invoice" ? "blue" : "green"}
                  style={{ marginRight: 0 }}
                >
                  {contract.documentType?.toUpperCase() || "CONTRACT"}
                </Tag>
                <Tag
                  color={
                    contract.status === "PAID"
                      ? "success"
                      : contract.status === "PARTIAL"
                      ? "warning"
                      : "default"
                  }
                >
                  {contract.status || "UNPAID"}
                </Tag>
              </div>

              {/* Customer Info */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <UserOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
                  <Text strong style={{ fontSize: 14 }}>{contract.customerName}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 22 }}>
                  {contract.customerAddress}
                </Text>
              </div>

              {/* Date and Price */}
              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <CalendarOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {contract.contractDate || contract.date}
                  </Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <DollarOutlined style={{ color: "#3f8600", fontSize: 14 }} />
                  <Text strong style={{ fontSize: 16, color: "#3f8600" }}>
                    ${parseFloat(contract.totalPrice || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(contract);
                  }}
                >
                  View
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(contract);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(contract);
                  }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* View Contract Modal */}
      <Modal
        title="Contract Details"
        open={!!selectedContract}
        onCancel={() => setSelectedContract(null)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setSelectedContract(null)}>
            Close
          </Button>,
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(selectedContract)}
          >
            Download PDF
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              const contract = selectedContract;
              setSelectedContract(null);
              handleEdit(contract);
            }}
          >
            Edit Contract
          </Button>,
        ]}
      >
        {selectedContract && (
          <>
            <Descriptions title="Company Information" bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Company Name">{selectedContract.companyName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Address">{selectedContract.companyAddress || "-"}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedContract.companyPhone || "-"}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedContract.companyEmail || "-"}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Customer Information" bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Customer Name">{selectedContract.customerName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Address">{selectedContract.customerAddress || "-"}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Contract Details" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Date">{selectedContract.contractDate || selectedContract.date || "-"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedContract.status === "PAID" ? "success" : selectedContract.status === "PARTIAL" ? "warning" : "default"}>
                  {selectedContract.status || "UNPAID"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Price">
                <Text strong style={{ color: "#3f8600", fontSize: 16 }}>
                  ${parseFloat(selectedContract.totalPrice || 0).toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Deposit">{selectedContract.depositPercent || 0}%</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Scope of Work" bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item>
                <div style={{ whiteSpace: "pre-wrap" }}>{selectedContract.scopeOfWork || "N/A"}</div>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="Additional Details" bordered size="small" column={2}>
              <Descriptions.Item label="Warranty">{selectedContract.warranty || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Payment Methods">{selectedContract.paymentMethods || "N/A"}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </>
  );
};

export default ContractList;
