import React from "react";
import { Table, Button, Space, Tag, Upload, Tooltip } from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  UploadOutlined,
  FileTextOutlined 
} from "@ant-design/icons";

const JobTable = ({
  jobs,
  onViewDetails,
  onEdit,
  onDelete,
  onReceiptUpload,
  processingReceipt = false,
  isMobile = false,
  isLoading = false,
  error = null,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "orange";
      case "In Progress":
        return "blue";
      case "Completed":
        return "green";
      case "Cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low":
        return "green";
      case "Medium":
        return "orange";
      case "High":
        return "red";
      case "Critical":
        return "volcano";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => (
        <div className="max-w-xs">
          <div className="font-medium">{text}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
      filters: [
        { text: "Pending", value: "Pending" },
        { text: "In Progress", value: "In Progress" },
        { text: "Completed", value: "Completed" },
        { text: "Cancelled", value: "Cancelled" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority}
        </Tag>
      ),
      filters: [
        { text: "Low", value: "Low" },
        { text: "Medium", value: "Medium" },
        { text: "High", value: "High" },
        { text: "Critical", value: "Critical" },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 120,
      sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: 120,
      sorter: (a, b) => new Date(a.endDate) - new Date(b.endDate),
    },
    {
      title: "Hours",
      key: "hours",
      width: 120,
      render: (_, record) => (
        <div className="text-sm">
          <div>Est: {record.estimatedHours}h</div>
          <div>Act: {record.actualHours}h</div>
        </div>
      ),
    },
    {
      title: "Total Cost",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 120,
      render: (cost) => (
        <span className="font-medium text-green-600">
          ${cost?.toFixed(2) || "0.00"}
        </span>
      ),
      sorter: (a, b) => (a.totalCost || 0) - (b.totalCost || 0),
    },
    {
      title: "Receipts",
      key: "receipts",
      width: 100,
      render: (_, record) => (
        <div className="text-center">
          <FileTextOutlined className="text-blue-500" />
          <span className="ml-1 text-sm text-gray-600">
            {record.receipts ? record.receipts.length : 0}
          </span>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {onViewDetails && (
            <Tooltip title="View Details">
              <Button
                type="primary"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(record)}
              />
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Edit Job">
              <Button
                type="default"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete Job">
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record.id)}
              />
            </Tooltip>
          )}
          {onReceiptUpload && (isMobile || true) && (
            <Tooltip title="Attach Receipt">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  onReceiptUpload(record.id, { target: { files: [file] } });
                  return false;
                }}
                disabled={processingReceipt}
              >
                <Button
                  type="default"
                  size="small"
                  icon={<UploadOutlined />}
                  loading={processingReceipt}
                  disabled={processingReceipt}
                />
              </Upload>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-2">Error loading jobs</div>
        <div className="text-gray-600">{error}</div>
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={jobs}
      rowKey="id"
      loading={isLoading}
      pagination={false} // We handle pagination in the parent component
      scroll={{ x: 1400 }}
      size="middle"
      className="bg-white rounded-lg shadow-sm"
    />
  );
};

export default JobTable;
