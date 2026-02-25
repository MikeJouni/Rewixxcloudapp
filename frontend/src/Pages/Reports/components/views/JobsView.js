import React, { useState, useMemo } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Row,
  Col,
  Statistic,
  Dropdown,
  Modal,
  message,
  Tooltip,
  DatePicker,
  Typography,
  Descriptions,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { generateInvoicePDF } from "../../services/invoiceGenerator";
import { generateContractPDF } from "../../../Contracts/utils/pdfGenerator";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const JobsView = ({
  jobs = [],
  customers = [],
  contracts = [],
  accountSettings,
  isLoading
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("All");
  const [dateRange, setDateRange] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  // Calculate payment status (matches JobTableColumns.js calculation)
  const calculatePaymentStatus = (job) => {
    if (!job) return { status: 'UNPAID', label: 'Unpaid' };

    const totalCost = computeTotalCost(job);
    const totalPaid = Array.isArray(job.payments) && job.payments.length > 0
      ? job.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
      : 0;

    if (totalPaid === 0) {
      return { status: 'UNPAID', label: 'Unpaid' };
    } else if (totalPaid >= totalCost) {
      return { status: 'PAID', label: 'Paid' };
    } else {
      return { status: 'PARTIALLY_PAID', label: 'Partially Paid' };
    }
  };

  // Get job status (work status)
  const getJobStatus = (job) => {
    if (job.status === 'COMPLETED') return { status: 'COMPLETE', label: 'Complete' };
    if (job.status === 'IN_PROGRESS') return { status: 'IN_PROGRESS', label: 'In Progress' };
    return { status: 'IN_PROGRESS', label: 'In Progress' };
  };

  // Filter jobs based on search, customer, and date range
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !searchTerm ||
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCustomer =
        customerFilter === "All" ||
        job.customer?.id?.toString() === customerFilter;

      let matchesDate = true;
      if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        const jobStart = dayjs(job.startDate);
        matchesDate =
          (jobStart.isAfter(dateRange[0]) || jobStart.isSame(dateRange[0], 'day')) &&
          (jobStart.isBefore(dateRange[1]) || jobStart.isSame(dateRange[1], 'day'));
      }

      return matchesSearch && matchesCustomer && matchesDate;
    });
  }, [jobs, searchTerm, customerFilter, dateRange]);

  // Calculate totals from filtered jobs
  const totals = useMemo(() => {
    const totalJobs = filteredJobs.length;
    const completedJobs = filteredJobs.filter(j => j.status === 'COMPLETED').length;
    const inProgressJobs = filteredJobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'PENDING').length;
    const totalRevenue = filteredJobs.reduce((sum, job) => sum + computeTotalCost(job), 0);
    const totalPaid = filteredJobs.reduce((sum, job) => {
      const payments = job.payments || [];
      return sum + payments.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0);
    }, 0);

    return {
      totalJobs,
      completedJobs,
      inProgressJobs,
      totalRevenue,
      totalPaid,
      outstanding: totalRevenue - totalPaid,
    };
  }, [filteredJobs]);

  // Check if a job has a contract
  const getJobContract = (jobId) => {
    return contracts.find(c => c.job?.id === jobId);
  };

  // Handle invoice export
  const handleExportInvoice = async (job) => {
    try {
      message.loading({ content: 'Generating invoice...', key: 'invoice' });
      await generateInvoicePDF(job, accountSettings);
      message.success({ content: 'Invoice generated successfully!', key: 'invoice' });
    } catch (error) {
      console.error('Error generating invoice:', error);
      message.error({ content: 'Failed to generate invoice', key: 'invoice' });
    }
  };

  // Handle contract export
  const handleExportContract = async (job) => {
    const contract = getJobContract(job.id);
    if (contract) {
      try {
        message.loading({ content: 'Generating contract...', key: 'contract' });
        await generateContractPDF(contract, accountSettings);
        message.success({ content: 'Contract generated successfully!', key: 'contract' });
      } catch (error) {
        console.error('Error generating contract:', error);
        message.error({ content: 'Failed to generate contract', key: 'contract' });
      }
    }
  };

  // Handle create contract redirect
  const handleCreateContract = (job) => {
    navigate(`/contracts/create?jobId=${job.id}`);
  };

  // Handle view job details
  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setDetailModalVisible(true);
  };

  // Get status tag for work status
  const renderWorkStatus = (job) => {
    const { status, label } = getJobStatus(job);
    if (status === 'COMPLETE') {
      return <Tag color="success">{label}</Tag>;
    }
    return <Tag color="processing">{label}</Tag>;
  };

  // Get status tag for payment status
  const renderPaymentStatus = (job) => {
    const { status, label } = calculatePaymentStatus(job);
    switch (status) {
      case 'PAID':
        return <Tag color="success">{label}</Tag>;
      case 'PARTIALLY_PAID':
        return <Tag color="warning">{label}</Tag>;
      case 'UNPAID':
        return <Tag color="error">{label}</Tag>;
      default:
        return <Tag>{label}</Tag>;
    }
  };

  // Actions dropdown menu items
  const getActionItems = (job) => {
    const contract = getJobContract(job.id);
    const items = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => handleViewDetails(job),
      },
      {
        key: 'invoice',
        label: 'Export Invoice',
        icon: <FilePdfOutlined />,
        onClick: () => handleExportInvoice(job),
      },
    ];

    if (contract) {
      items.push({
        key: 'contract',
        label: 'Export Contract',
        icon: <FileTextOutlined />,
        onClick: () => handleExportContract(job),
      });
    } else {
      items.push({
        key: 'create-contract',
        label: 'Create Contract',
        icon: <PlusOutlined />,
        onClick: () => handleCreateContract(job),
      });
    }

    return items;
  };

  const columns = [
    {
      title: 'Job',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.workSiteAddress && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.workSiteAddress}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      sorter: (a, b) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
      render: (text) => text || '-',
      responsive: ['md'],
    },
    {
      title: 'Work Status',
      key: 'workStatus',
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      render: (_, record) => renderWorkStatus(record),
    },
    {
      title: 'Payment',
      key: 'paymentStatus',
      render: (_, record) => renderPaymentStatus(record),
    },
    {
      title: 'Total Cost',
      key: 'totalCost',
      sorter: (a, b) => computeTotalCost(a) - computeTotalCost(b),
      render: (_, record) => (
        <Text strong>${computeTotalCost(record).toFixed(2)}</Text>
      ),
      responsive: ['sm'],
    },
    {
      title: 'Date',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
      render: (date) => date ? dayjs(date).format('MMM D, YYYY') : '-',
      responsive: ['lg'],
    },
    {
      title: 'Contract',
      key: 'contract',
      render: (_, record) => {
        const contract = getJobContract(record.id);
        if (contract) {
          return <Tag color="success">Yes</Tag>;
        }
        return (
          <Tooltip title="Click to create contract">
            <Tag
              color="warning"
              style={{ cursor: 'pointer' }}
              onClick={() => handleCreateContract(record)}
            >
              Missing
            </Tag>
          </Tooltip>
        );
      },
      responsive: ['md'],
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Jobs"
              value={totals.totalJobs}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Completed"
              value={totals.completedJobs}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Revenue"
              value={totals.totalRevenue}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Outstanding"
              value={totals.outstanding}
              prefix="$"
              precision={2}
              valueStyle={{ color: totals.outstanding > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={8}>
            <Input
              placeholder="Search jobs or customers..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              value={customerFilter}
              onChange={setCustomerFilter}
              style={{ width: '100%' }}
              placeholder="Filter by customer"
              showSearch
              optionFilterProp="children"
            >
              <Option value="All">All Customers</Option>
              {customers.map((customer) => (
                <Option key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['Start', 'End']}
            />
          </Col>
        </Row>
      </Card>

      {/* Jobs Table */}
      <Card size="small">
        <Table
          columns={columns}
          dataSource={filteredJobs}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            size: 'small',
          }}
          scroll={{ x: 600 }}
          size="middle"
        />
      </Card>

      {/* Job Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <span>Job Details</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          getJobContract(selectedJob?.id) && (
            <Button
              key="contract"
              icon={<FileTextOutlined />}
              onClick={() => {
                handleExportContract(selectedJob);
              }}
            >
              Export Contract
            </Button>
          ),
          <Button
            key="invoice"
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => {
              handleExportInvoice(selectedJob);
              setDetailModalVisible(false);
            }}
          >
            Export Invoice
          </Button>,
        ].filter(Boolean)}
        width={700}
      >
        {selectedJob && (
          <>
            {/* Header with Title and Status Tags */}
            <div style={{
              background: '#fafafa',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <Text strong style={{ fontSize: 18 }}>{selectedJob.title}</Text>
                  {selectedJob.customer?.name && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">Customer: </Text>
                      <Text>{selectedJob.customer.name}</Text>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {renderWorkStatus(selectedJob)}
                  {renderPaymentStatus(selectedJob)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Total Cost</Text>
                  <div>
                    <Text strong style={{ fontSize: 20, color: '#3f8600' }}>
                      ${computeTotalCost(selectedJob).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </div>
                </div>
                {selectedJob.payments && selectedJob.payments.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Amount Paid</Text>
                    <div>
                      <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
                        ${selectedJob.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Information */}
            <Descriptions
              title="Schedule"
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Start Date">
                {selectedJob.startDate ? dayjs(selectedJob.startDate).format('MMM D, YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {selectedJob.endDate ? dayjs(selectedJob.endDate).format('MMM D, YYYY') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Location */}
            {selectedJob.workSiteAddress && (
              <Descriptions
                title="Work Site Location"
                bordered
                size="small"
                column={1}
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item>{selectedJob.workSiteAddress}</Descriptions.Item>
              </Descriptions>
            )}

            {/* Pricing Breakdown */}
            <Descriptions
              title="Pricing Breakdown"
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Job Price">
                ${(Number(selectedJob.jobPrice) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Descriptions.Item>
              <Descriptions.Item label="Material Cost (Billing)">
                ${(Number(selectedJob.customMaterialCost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Descriptions.Item>
              <Descriptions.Item label="Tax (6%)">
                {selectedJob.includeTax ? (
                  <Text>${(((Number(selectedJob.customMaterialCost) || 0) + (Number(selectedJob.jobPrice) || 0)) * 0.06).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                ) : (
                  <Text type="secondary">Not included</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <Text strong style={{ color: '#3f8600' }}>
                  ${computeTotalCost(selectedJob).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Description */}
            {selectedJob.description && (
              <Descriptions
                title="Description"
                bordered
                size="small"
                column={1}
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedJob.description}</div>
                </Descriptions.Item>
              </Descriptions>
            )}

            {/* Contract Status */}
            <div style={{
              background: getJobContract(selectedJob.id) ? '#f6ffed' : '#fffbe6',
              padding: 12,
              borderRadius: 6,
              border: `1px solid ${getJobContract(selectedJob.id) ? '#b7eb8f' : '#ffe58f'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>Contract Status: </Text>
                  {getJobContract(selectedJob.id) ? (
                    <Tag color="success">Contract Exists</Tag>
                  ) : (
                    <Tag color="warning">No Contract</Tag>
                  )}
                </div>
                {!getJobContract(selectedJob.id) && (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<PlusOutlined />}
                    onClick={() => {
                      handleCreateContract(selectedJob);
                      setDetailModalVisible(false);
                    }}
                  >
                    Create Contract
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default JobsView;
