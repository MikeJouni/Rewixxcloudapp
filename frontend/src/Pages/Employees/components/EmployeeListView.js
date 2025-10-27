import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Table, Tag, Modal } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import useEmployees from "../hooks/useEmployees";

const { Search } = Input;
const { confirm } = Modal;

const EmployeeListView = () => {
  const navigate = useNavigate();
  const {
    employees,
    isLoading,
    searchTerm,
    setSearchTerm,
    deleteEmployee,
    toggleStatus,
  } = useEmployees();

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleEdit = (employee) => {
    navigate(`/employees/edit/${employee.id}`, { state: { employee } });
  };

  const handleDelete = (employee) => {
    confirm({
      title: "Delete Employee",
      content: `Are you sure you want to delete ${employee.name}?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteEmployee.mutateAsync(employee.id);
        } catch (error) {
          console.error("Failed to delete employee:", error);
        }
      },
    });
  };

  const handleToggleStatus = async (employee) => {
    try {
      await toggleStatus.mutateAsync(employee.id);
    } catch (error) {
      console.error("Failed to toggle employee status:", error);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.email && <div className="text-xs text-gray-500">{record.email}</div>}
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "-",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (address) => address || "-",
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      width: 100,
      render: (active) => (
        <Tag color={active ? "green" : "red"} icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.active === value,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type={record.active ? "default" : "primary"}
            size="small"
            onClick={() => handleToggleStatus(record)}
          >
            {record.active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            type="default"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Employee Management
        </h1>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate("/employees/create")}
          style={{ background: '#1f2937' }}
        >
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Search
          placeholder="Search employees by name, email, or phone..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && setSearchTerm("")}
          className="max-w-md"
        />
      </div>

      {/* Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Total Employees: <span className="font-semibold">{employees.length}</span>
          {" | "}
          Active: <span className="font-semibold text-green-600">
            {employees.filter(e => e.active).length}
          </span>
          {" | "}
          Inactive: <span className="font-semibold text-red-600">
            {employees.filter(e => !e.active).length}
          </span>
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`,
          }}
        />
      </div>
    </div>
  );
};

export default EmployeeListView;
