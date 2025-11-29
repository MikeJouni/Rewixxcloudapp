import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Table, Tag, message } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import useEmployees from "../hooks/useEmployees";
import ConfirmModal from "../../../components/ConfirmModal";

const { Search } = Input;

const EmployeeListView = () => {
  const navigate = useNavigate();
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    employees,
    isLoading,
    error,
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
    if (!employee || !employee.id) {
      message.error("Invalid employee data");
      return;
    }
    setEmployeeToDelete(employee);
  };

  const handleToggleStatus = async (employee) => {
    try {
      await toggleStatus.mutateAsync(employee.id);
      message.success(`Employee ${employee.active ? "deactivated" : "activated"} successfully`);
    } catch (error) {
      console.error("Failed to toggle employee status:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to update employee status. Please try again.";
      message.error(errorMessage);
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

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Error loading employees: {error.message || "Unknown error"}
          </p>
        </div>
      )}

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

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow">
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : employees && employees.length > 0 ? (
          employees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              {/* Header with Name and Status */}
              <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{employee.name}</div>
                    {employee.email && (
                      <div className="text-xs text-gray-500 mt-1">{employee.email}</div>
                    )}
                  </div>
                  <Tag
                    color={employee.active ? "green" : "red"}
                    icon={employee.active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  >
                    {employee.active ? "Active" : "Inactive"}
                  </Tag>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Phone</div>
                  <div className="text-sm text-gray-900">{employee.phone || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Address</div>
                  <div className="text-sm text-gray-900 truncate" title={employee.address}>
                    {employee.address || "—"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(employee)}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                >
                  <EditOutlined />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(employee)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    employee.active
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {employee.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(employee)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  <DeleteOutlined />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No employees found</div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!employeeToDelete}
        title="Delete Employee"
        message={employeeToDelete ? `This will permanently delete employee "${employeeToDelete.name}" and cannot be undone.` : ""}
        confirmLabel="Delete Employee"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onCancel={() => setEmployeeToDelete(null)}
        onConfirm={() => {
          if (!employeeToDelete) return;
          setIsDeleting(true);
          deleteEmployee.mutate(employeeToDelete.id, {
            onSuccess: () => {
              message.success("Employee deleted successfully");
              setEmployeeToDelete(null);
            },
            onError: (error) => {
              console.error("Failed to delete employee:", error);
              const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to delete employee. Please try again.";
              message.error(errorMessage);
            },
            onSettled: () => {
              setIsDeleting(false);
            }
          });
        }}
      />
    </div>
  );
};

export default EmployeeListView;
