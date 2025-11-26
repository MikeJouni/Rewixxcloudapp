import React from "react";
import { Card, Empty, Tag, Row, Col } from "antd";
import { FileTextOutlined, CalendarOutlined, UserOutlined, DollarOutlined } from "@ant-design/icons";

const ContractList = ({ contracts = [] }) => {
  if (contracts.length === 0) {
    return (
      <Card>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
          description={
            <div>
              <p className="text-gray-600 text-base">No contracts yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first contract using the form above
              </p>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {contracts.map((contract) => (
        <Col xs={24} sm={12} lg={8} xl={6} key={contract.id}>
          <Card
            hoverable
            className="h-full"
            style={{
              borderRadius: "8px",
              transition: "all 0.3s ease",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <Tag
                  color={contract.documentType === "invoice" ? "blue" : "green"}
                  style={{ marginRight: 0, fontSize: "12px", fontWeight: "500" }}
                >
                  {contract.documentType?.toUpperCase()}
                </Tag>
                <Tag
                  color={
                    contract.status === "paid"
                      ? "success"
                      : contract.status === "partial"
                      ? "warning"
                      : "default"
                  }
                >
                  {contract.status?.toUpperCase()}
                </Tag>
              </div>

              {/* Customer Info */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserOutlined style={{ color: "#8c8c8c", fontSize: "14px" }} />
                  <span className="font-semibold text-sm">{contract.customerName}</span>
                </div>
                <div className="text-xs text-gray-500 ml-6">
                  {contract.customerAddress}
                </div>
              </div>

              {/* Date and Price */}
              <div className="mt-auto">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarOutlined style={{ color: "#8c8c8c", fontSize: "12px" }} />
                  <span className="text-xs text-gray-600">{contract.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarOutlined style={{ color: "#52c41a", fontSize: "14px" }} />
                  <span className="font-bold text-base" style={{ color: "#52c41a" }}>
                    ${contract.totalPrice?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default ContractList;
