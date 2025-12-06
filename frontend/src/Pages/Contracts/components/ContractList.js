import React, { useState } from "react";
import { Card, Empty, Tag, Row, Col, Button, Dropdown, message } from "antd";
import { FileTextOutlined, CalendarOutlined, UserOutlined, DollarOutlined, EyeOutlined, EditOutlined, DownloadOutlined, MoreOutlined } from "@ant-design/icons";

const ContractList = ({ contracts = [], onEdit, onView, onDownload }) => {
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

  const getMenuItems = (contract) => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "View",
      onClick: () => handleView(contract),
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit",
      onClick: () => handleEdit(contract),
    },
    {
      key: "download",
      icon: <DownloadOutlined />,
      label: "Download PDF",
      onClick: () => handleDownload(contract),
    },
  ];

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
    <>
      <Row gutter={[16, 16]}>
        {contracts.map((contract) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={contract.id}>
            <Card
              hoverable
              className="h-full cursor-pointer"
              style={{
                borderRadius: "8px",
                transition: "all 0.3s ease",
              }}
              bodyStyle={{ padding: "16px" }}
              onClick={() => handleView(contract)}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <Tag
                    color={contract.documentType === "invoice" ? "blue" : "green"}
                    style={{ marginRight: 0, fontSize: "12px", fontWeight: "500" }}
                  >
                    {contract.documentType?.toUpperCase() || "CONTRACT"}
                  </Tag>
                  <div className="flex items-center gap-2">
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
                    <Dropdown
                      menu={{ items: getMenuItems(contract) }}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<MoreOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                  </div>
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
                    <span className="text-xs text-gray-600">
                      {contract.contractDate || contract.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarOutlined style={{ color: "#52c41a", fontSize: "14px" }} />
                    <span className="font-bold text-base" style={{ color: "#52c41a" }}>
                      ${parseFloat(contract.totalPrice || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
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
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* View Contract Modal */}
      {selectedContract && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedContract(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Contract Details</h3>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Company Info */}
              <div className="border-b pb-3">
                <h4 className="font-semibold text-gray-700 mb-2">Company</h4>
                <p className="font-medium">{selectedContract.companyName}</p>
                <p className="text-sm text-gray-600">{selectedContract.companyAddress}</p>
                <p className="text-sm text-gray-600">{selectedContract.companyPhone}</p>
                <p className="text-sm text-gray-600">{selectedContract.companyEmail}</p>
              </div>

              {/* Customer Info */}
              <div className="border-b pb-3">
                <h4 className="font-semibold text-gray-700 mb-2">Customer</h4>
                <p className="font-medium">{selectedContract.customerName}</p>
                <p className="text-sm text-gray-600">{selectedContract.customerAddress}</p>
              </div>

              {/* Contract Details */}
              <div className="border-b pb-3">
                <h4 className="font-semibold text-gray-700 mb-2">Contract Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Date:</span>
                    <p className="font-medium">{selectedContract.contractDate || selectedContract.date}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <p>
                      <Tag color={selectedContract.status === "PAID" ? "success" : selectedContract.status === "PARTIAL" ? "warning" : "default"}>
                        {selectedContract.status || "UNPAID"}
                      </Tag>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total Price:</span>
                    <p className="font-bold text-lg text-green-600">
                      ${parseFloat(selectedContract.totalPrice || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Deposit:</span>
                    <p className="font-medium">{selectedContract.depositPercent || 0}%</p>
                  </div>
                </div>
              </div>

              {/* Scope of Work */}
              <div className="border-b pb-3">
                <h4 className="font-semibold text-gray-700 mb-2">Scope of Work</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedContract.scopeOfWork || "N/A"}</p>
              </div>

              {/* Warranty & Payment */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Warranty</h4>
                    <p className="text-sm text-gray-700">{selectedContract.warranty || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Payment Methods</h4>
                    <p className="text-sm text-gray-700">{selectedContract.paymentMethods || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    const contract = selectedContract;
                    setSelectedContract(null);
                    handleEdit(contract);
                  }}
                >
                  Edit Contract
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const contract = selectedContract;
                    handleDownload(contract);
                  }}
                >
                  Download PDF
                </Button>
                <Button onClick={() => setSelectedContract(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContractList;
