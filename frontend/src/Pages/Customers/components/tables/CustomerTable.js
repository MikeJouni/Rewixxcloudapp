import React, { useCallback } from "react";
import { Table, Button, Popconfirm, Space, Input } from "antd";
import { useNavigate } from "react-router-dom";
import useCustomers from "../../hooks/useCustomers";

const { Search } = Input;

const CustomerTable = ({ onDelete }) => {
  const navigate = useNavigate();
  const {
    customers,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCustomers,
    searchTerm,
    setSearchTerm,
  } = useCustomers();

  // Ant Design pagination configuration
  const pagination = {
    current: page + 1, // Ant Design uses 1-based indexing
    pageSize: pageSize,
    total: totalCustomers,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    pageSizeOptions: ["5", "10", "25", "50"],
    onChange: (newPage, newPageSize) => {
      setPage(newPage - 1); // Convert back to 0-based indexing
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
        setPage(0); // Reset to first page when changing page size
      }
    },
  };

  // Handle row click for navigation
  const handleRowClick = (record) => {
    // Safety check to ensure the record exists and has an id
    if (record && record.id) {
      navigate(`/customers/${record.id}`);
    }
  };

  // Handle button clicks to prevent row navigation
  const handleButtonClick = (e) => {
    e.stopPropagation();
  };

  // Handle search with debouncing
  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value);
      setPage(0); // Reset to first page when searching
    },
    [setSearchTerm, setPage]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (value) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleSearch(value);
        }, 300); // 300ms delay
      };
    })(),
    [handleSearch]
  );

  if (!customers || customers.length === 0) {
    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <Search
          placeholder="Search customers..."
          allowClear
          size="large"
          onChange={(e) => debouncedSearch(e.target.value)}
          defaultValue={searchTerm}
          style={{ maxWidth: 400 }}
        />

        <p className="text-center text-gray-500 mt-8">
          No customers found matching your search.
        </p>
      </div>
    );
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Address",
      key: "address",
      render: (_, customer) => (
        <>
          {[customer.addressLine1, customer.addressLine2]
            .filter(Boolean)
            .join(", ")}
          <br />
          {[customer.city, customer.state, customer.zip]
            .filter(Boolean)
            .join(", ")}
        </>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, customer) => (
        <Space>
          <Button
            size="small"
            style={{
              backgroundColor: "#6b7280",
              color: "#fff",
              border: "none",
              padding: "2px 8px",
              fontSize: "12px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#4b5563")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#6b7280")
            }
            onClick={(e) => {
              handleButtonClick(e);
              navigate(`/customers/${customer.id}`);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this customer?"
            onConfirm={(e) => {
              // Prevent any event bubbling
              if (e) e.stopPropagation();
              onDelete(customer.id);
            }}
            okText="Yes"
            cancelText="No"
            onCancel={(e) => {
              // Prevent row click when canceling
              if (e) e.stopPropagation();
            }}
          >
            <Button
              danger
              type="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Search
        placeholder="Search customers..."
        allowClear
        size="large"
        onChange={(e) => debouncedSearch(e.target.value)}
        defaultValue={searchTerm}
        style={{ maxWidth: 400 }}
      />

      {/* Table */}
      <Table
        key={`customers-table-${customers.length}-${page}`}
        columns={columns}
        dataSource={customers}
        rowKey="id"
        pagination={pagination}
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: "pointer" },
        })}
        scroll={{ x: "max-content" }}
        size="small"
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default CustomerTable;
