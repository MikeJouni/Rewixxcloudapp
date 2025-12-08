import React, { useState, useMemo } from "react";
import {
  Card,
  Input,
  Row,
  Col,
  Statistic,
  Table,
  Modal,
  Button,
  Space,
  Empty,
  Tag,
  Typography,
  Descriptions,
  Divider,
  List,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { generateInvoicePDF } from "../../services/invoiceGenerator";

const { Text, Title } = Typography;

const CustomersView = ({
  customers = [],
  jobs = [],
  accountSettings,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Calculate total cost for a job (matches JobTableColumns.js calculation)
  // Total = customMaterialCost + jobPrice + tax (6% if includeTax)
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

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search) ||
        customer.username?.toLowerCase().includes(search)
      );
    });
  }, [customers, searchTerm]);

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

  // Calculate totals
  const totals = useMemo(() => {
    const totalCustomers = filteredCustomers.length;
    const customersWithJobs = filteredCustomers.filter(
      (c) => jobs.some((j) => j.customer?.id === c.id)
    ).length;
    const totalRevenue = jobs.reduce((sum, job) => sum + computeTotalCost(job), 0);

    return {
      totalCustomers,
      customersWithJobs,
      totalRevenue,
    };
  }, [filteredCustomers, jobs]);

  // Handle customer profile view
  const handleViewProfile = (customer) => {
    setSelectedCustomer(customer);
    setProfileModalVisible(true);
  };

  // Handle export invoice for job
  const handleExportInvoice = async (job) => {
    try {
      await generateInvoicePDF(job, accountSettings);
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  // Selected customer stats
  const selectedCustomerStats = selectedCustomer
    ? getCustomerStats(selectedCustomer.id)
    : null;

  // Customer table columns
  const columns = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (text, record) => (
        <div>
          <Text strong>{text || 'Unknown'}</Text>
          {record.phone && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <PhoneOutlined style={{ marginRight: 4 }} />
                {record.phone}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'username',
      key: 'username',
      render: (text) => text || '-',
      responsive: ['md'],
    },
    {
      title: 'Jobs',
      key: 'jobs',
      render: (_, record) => {
        const stats = getCustomerStats(record.id);
        return <Text>{stats.totalJobs}</Text>;
      },
      sorter: (a, b) => getCustomerStats(a.id).totalJobs - getCustomerStats(b.id).totalJobs,
    },
    {
      title: 'Revenue',
      key: 'revenue',
      render: (_, record) => {
        const stats = getCustomerStats(record.id);
        return <Text strong>${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>;
      },
      sorter: (a, b) => getCustomerStats(a.id).totalRevenue - getCustomerStats(b.id).totalRevenue,
      responsive: ['sm'],
    },
    {
      title: 'Outstanding',
      key: 'outstanding',
      render: (_, record) => {
        const stats = getCustomerStats(record.id);
        return (
          <Text style={{ color: stats.outstandingBalance > 0 ? '#cf1322' : '#3f8600' }}>
            ${stats.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        );
      },
      responsive: ['md'],
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewProfile(record)}
        >
          View
        </Button>
      ),
    },
  ];

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

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Customers"
              value={totals.totalCustomers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Active Customers"
              value={totals.customersWithJobs}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Revenue"
              value={totals.totalRevenue}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by name, phone, or email..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </Card>

      {/* Customers Table */}
      <Card size="small">
        {filteredCustomers.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredCustomers}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              size: 'small',
            }}
            size="middle"
          />
        ) : (
          <Empty description="No customers found" />
        )}
      </Card>

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
    </div>
  );
};

export default CustomersView;
