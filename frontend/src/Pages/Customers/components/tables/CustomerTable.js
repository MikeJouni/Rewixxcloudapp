import React, { useState, useMemo } from "react";
import { Table, Button, Input, Space, Modal, Tag, Typography, Descriptions, Divider, Statistic, Row, Col, Empty } from "antd";
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import CustomerForm from "../forms/CustomerForm";
import * as jobService from "../../../Jobs/services/jobService";
import * as accountSettingsService from "../../../../services/accountSettingsService";
import { generateInvoicePDF } from "../../../Reports/services/invoiceGenerator";
import { useAuth } from "../../../../AuthContext";

const { Text } = Typography;

const CustomerTable = ({ customers, onDelete, onUpdate }) => {
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const { token } = useAuth();

  // Fetch jobs data for customer stats
  const { data: jobsData } = useQuery({
    queryKey: ["jobs"],
    queryFn: () =>
      jobService.getJobsList({
        searchTerm: "",
        page: 0,
        pageSize: 10000,
        statusFilter: "All",
      }),
  });

  // Fetch account settings for invoice generation
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token,
  });

  const jobs = jobsData?.jobs || [];

  // Calculate total cost for a job
  const computeTotalCost = (job) => {
    if (!job) return 0;
    const billingMaterialCost = job.customMaterialCost !== undefined && job.customMaterialCost !== null
      ? Number(job.customMaterialCost)
      : 0;
    const jobPrice = Number(job.jobPrice) || 0;
    const subtotal = billingMaterialCost + jobPrice;
    const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
    return subtotal + taxAmount;
  };

  // Calculate customer stats
  const getCustomerStats = (customerId) => {
    const customerJobs = jobs.filter((j) => j.customer?.id === customerId);
    const totalJobs = customerJobs.length;
    const completedJobs = customerJobs.filter((j) => j.status === "COMPLETED").length;
    const inProgressJobs = customerJobs.filter((j) => j.status === "IN_PROGRESS" || j.status === "PENDING").length;
    const totalRevenue = customerJobs.reduce((sum, job) => sum + computeTotalCost(job), 0);
    const totalPaid = customerJobs.reduce((sum, job) => {
      const jobPayments = job.payments || [];
      return sum + jobPayments.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0);
    }, 0);
    const outstandingBalance = totalRevenue - totalPaid;

    return {
      totalJobs,
      completedJobs,
      inProgressJobs,
      totalRevenue,
      totalPaid,
      outstandingBalance,
      customerJobs,
    };
  };

  // Selected customer stats
  const selectedCustomerStats = useMemo(() => {
    return selectedCustomer ? getCustomerStats(selectedCustomer.id) : null;
  }, [selectedCustomer, jobs]);

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setUpdateError(null);
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setUpdateError(null);
  };

  const handleSaveEdit = async (formData) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      await onUpdate({ id: editingCustomer.id, ...formData });
      setEditingCustomer(null);
    } catch (error) {
      console.error("Failed to update customer:", error);
      setUpdateError(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewProfile = (customer) => {
    setSelectedCustomer(customer);
    setProfileModalVisible(true);
  };

  const handleExportInvoice = async (job) => {
    try {
      await generateInvoicePDF(job, accountSettings);
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  // Jobs table columns for profile modal
  const jobColumns = [
    {
      title: 'Job',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'COMPLETED' ? 'success' : 'processing'}>
          {status === 'COMPLETED' ? 'Complete' : 'In Progress'}
        </Tag>
      ),
    },
    {
      title: 'Total Cost',
      key: 'totalCost',
      render: (_, record) => `$${computeTotalCost(record).toFixed(2)}`,
    },
    {
      title: 'Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => (date ? dayjs(date).format('MMM D, YYYY') : '-'),
      responsive: ['md'],
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<FilePdfOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleExportInvoice(record);
          }}
        >
          Invoice
        </Button>
      ),
    },
  ];

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'username',
      key: 'username',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search by email"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
              disabled={!selectedKeys[0]}
            >
              Reset
            </Button>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => record.username.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search by phone"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
              disabled={!selectedKeys[0]}
            >
              Reset
            </Button>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        // Remove all non-digit characters from both the search value and record phone
        const searchDigits = value.replace(/\D/g, '');
        const recordDigits = record.phone.replace(/\D/g, '');
        return recordDigits.includes(searchDigits);
      },
    },
    {
      title: 'Address',
      key: 'address',
      render: (_, record) => (
        <div>
          <div>{[record.addressLine1, record.addressLine2].filter(Boolean).join(", ")}</div>
          <div className="text-gray-500 text-sm">
            {[record.city, record.state, record.zip].filter(Boolean).join(", ")}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            onClick={() => handleViewProfile(record)}
          >
            View
          </button>
          <button
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            onClick={() => handleEdit(record)}
          >
            Edit
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            onClick={() => onDelete(record)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
          defaultSortOrder="descend"
          sortDirections={['descend', 'ascend']}
          className="responsive-table"
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {customers && customers.length > 0 ? (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              {/* Header with ID and Name */}
              <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ID: {customer.id}</div>
                    <div className="text-lg font-semibold text-gray-900">{customer.name}</div>
                  </div>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Email</div>
                  <div className="text-sm text-gray-900">{customer.username}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Phone</div>
                  <div className="text-sm text-gray-900">{customer.phone}</div>
                </div>
              </div>

              {/* Address */}
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">Address</div>
                <div className="text-sm text-gray-900">
                  {[customer.addressLine1, customer.addressLine2].filter(Boolean).join(", ")}
                </div>
                <div className="text-sm text-gray-500">
                  {[customer.city, customer.state, customer.zip].filter(Boolean).join(", ")}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleViewProfile(customer)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(customer)}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-md text-sm font-medium hover:bg-yellow-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(customer)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No customers found</div>
        )}
      </div>

      {/* Edit Form Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Customer</h3>
              <button
                onClick={handleCancelEdit}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <CustomerForm
              initialData={editingCustomer}
              onSubmit={handleSaveEdit}
              onCancel={handleCancelEdit}
              isLoading={isUpdating}
              error={updateError}
            />
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      <Modal
        title="Customer Profile"
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setProfileModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedCustomer && selectedCustomerStats && (
          <div>
            {/* Customer Info */}
            <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
              <Descriptions.Item label="Name" span={2}>
                <Text strong>{selectedCustomer.name || 'Unknown'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedCustomer.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedCustomer.username || '-'}
              </Descriptions.Item>
              {(selectedCustomer.addressLine1 || selectedCustomer.city) && (
                <Descriptions.Item label="Address" span={2}>
                  {[
                    selectedCustomer.addressLine1,
                    selectedCustomer.addressLine2,
                    selectedCustomer.city,
                    selectedCustomer.state,
                    selectedCustomer.zip,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Jobs"
                  value={selectedCustomerStats.totalJobs}
                  size="small"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Revenue"
                  value={selectedCustomerStats.totalRevenue}
                  prefix="$"
                  precision={2}
                  size="small"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Paid"
                  value={selectedCustomerStats.totalPaid}
                  prefix="$"
                  precision={2}
                  size="small"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Outstanding"
                  value={selectedCustomerStats.outstandingBalance}
                  prefix="$"
                  precision={2}
                  valueStyle={{
                    color: selectedCustomerStats.outstandingBalance > 0 ? '#cf1322' : '#3f8600',
                  }}
                  size="small"
                />
              </Col>
            </Row>

            {/* Job Status Summary */}
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color="success">
                  <CheckCircleOutlined /> {selectedCustomerStats.completedJobs} Completed
                </Tag>
                <Tag color="processing">
                  <ClockCircleOutlined /> {selectedCustomerStats.inProgressJobs} In Progress
                </Tag>
              </Space>
            </div>

            {/* Jobs Table */}
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Jobs History</Text>
            {selectedCustomerStats.customerJobs.length > 0 ? (
              <Table
                columns={jobColumns}
                dataSource={selectedCustomerStats.customerJobs}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5, size: 'small' }}
              />
            ) : (
              <Empty description="No jobs assigned to this customer" />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CustomerTable;
