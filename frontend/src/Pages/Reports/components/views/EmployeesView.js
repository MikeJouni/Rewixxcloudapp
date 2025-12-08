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
  Select,
  Typography,
  Descriptions,
  Divider,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;

const EmployeesView = ({
  employees = [],
  expenses = [],
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Filter employees based on search and status
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        !searchTerm ||
        employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && employee.active !== false) ||
        (statusFilter === "Inactive" && employee.active === false);

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  // Get labor entries for an employee (from LABOR type expenses)
  const getEmployeeLaborEntries = (employeeName) => {
    return expenses.filter(
      (expense) =>
        expense.type === "LABOR" &&
        expense.employeeName?.toLowerCase() === employeeName?.toLowerCase()
    );
  };

  // Calculate employee stats
  const getEmployeeStats = (employee) => {
    const laborEntries = getEmployeeLaborEntries(employee.name);
    const totalHours = laborEntries.reduce(
      (sum, entry) => sum + (parseFloat(entry.hoursWorked) || 0),
      0
    );
    const totalEarnings = laborEntries.reduce((sum, entry) => {
      const hours = parseFloat(entry.hoursWorked) || 0;
      const rate = parseFloat(entry.hourlyRate) || 0;
      return sum + hours * rate;
    }, 0);
    const avgHourlyRate =
      laborEntries.length > 0
        ? laborEntries.reduce(
            (sum, entry) => sum + (parseFloat(entry.hourlyRate) || 0),
            0
          ) / laborEntries.length
        : 0;

    return {
      totalHours,
      totalEarnings,
      avgHourlyRate,
      laborEntries,
      entryCount: laborEntries.length,
    };
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalEmployees = filteredEmployees.length;
    const activeEmployees = filteredEmployees.filter(
      (e) => e.active !== false
    ).length;
    const totalLaborExpenses = expenses
      .filter((e) => e.type === "LABOR")
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalHoursWorked = expenses
      .filter((e) => e.type === "LABOR")
      .reduce((sum, e) => sum + (parseFloat(e.hoursWorked) || 0), 0);

    return {
      totalEmployees,
      activeEmployees,
      totalLaborExpenses,
      totalHoursWorked,
    };
  }, [filteredEmployees, expenses]);

  // Handle employee profile view
  const handleViewProfile = (employee) => {
    setSelectedEmployee(employee);
    setProfileModalVisible(true);
  };

  // Selected employee stats
  const selectedEmployeeStats = selectedEmployee
    ? getEmployeeStats(selectedEmployee)
    : null;

  // Employee table columns
  const columns = [
    {
      title: 'Employee',
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
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
      responsive: ['md'],
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active !== false ? 'success' : 'default'}>
          {active !== false ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Hours',
      key: 'hours',
      render: (_, record) => {
        const stats = getEmployeeStats(record);
        return <Text>{stats.totalHours.toFixed(1)} hrs</Text>;
      },
      sorter: (a, b) => getEmployeeStats(a).totalHours - getEmployeeStats(b).totalHours,
      responsive: ['sm'],
    },
    {
      title: 'Earnings',
      key: 'earnings',
      render: (_, record) => {
        const stats = getEmployeeStats(record);
        return <Text strong>${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>;
      },
      sorter: (a, b) => getEmployeeStats(a).totalEarnings - getEmployeeStats(b).totalEarnings,
      responsive: ['sm'],
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

  // Labor entries table columns
  const laborColumns = [
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      render: (date) => (date ? dayjs(date).format('MMM D, YYYY') : '-'),
      sorter: (a, b) => new Date(a.expenseDate) - new Date(b.expenseDate),
    },
    {
      title: 'Hours',
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      render: (hours) => `${parseFloat(hours || 0).toFixed(1)} hrs`,
    },
    {
      title: 'Rate',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      render: (rate) => `$${parseFloat(rate || 0).toFixed(2)}/hr`,
      responsive: ['sm'],
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => {
        const total =
          (parseFloat(record.hoursWorked) || 0) *
          (parseFloat(record.hourlyRate) || 0);
        return <Text strong>${total.toFixed(2)}</Text>;
      },
    },
    {
      title: 'Job',
      dataIndex: ['job', 'title'],
      key: 'job',
      render: (text) => text || '-',
      responsive: ['md'],
    },
  ];

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Employees"
              value={totals.totalEmployees}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Active"
              value={totals.activeEmployees}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Hours"
              value={totals.totalHoursWorked}
              precision={1}
              suffix="hrs"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Labor Cost"
              value={totals.totalLaborExpenses}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={16}>
            <Input
              placeholder="Search by name, phone, or email..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="All">All Employees</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Employees Table */}
      <Card size="small">
        {filteredEmployees.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredEmployees}
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
          <Empty description="No employees found" />
        )}
      </Card>

      {/* Employee Profile Modal */}
      <Modal
        title="Employee Profile"
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setProfileModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedEmployee && selectedEmployeeStats && (
          <div>
            {/* Employee Info */}
            <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
              <Descriptions.Item label="Name">
                <Text strong>{selectedEmployee.name || 'Unknown'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedEmployee.active !== false ? 'success' : 'default'}>
                  {selectedEmployee.active !== false ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedEmployee.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedEmployee.email || '-'}
              </Descriptions.Item>
              {selectedEmployee.address && (
                <Descriptions.Item label="Address" span={2}>
                  {selectedEmployee.address}
                </Descriptions.Item>
              )}
              {selectedEmployee.createdAt && (
                <Descriptions.Item label="Joined">
                  {dayjs(selectedEmployee.createdAt).format('MMM D, YYYY')}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedEmployee.notes && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div>
                  <Text type="secondary">Notes:</Text>
                  <div>{selectedEmployee.notes}</div>
                </div>
              </>
            )}

            <Divider style={{ margin: '16px 0' }} />

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Hours"
                  value={selectedEmployeeStats.totalHours}
                  precision={1}
                  suffix="hrs"
                  size="small"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Earnings"
                  value={selectedEmployeeStats.totalEarnings}
                  prefix="$"
                  precision={2}
                  size="small"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Avg Rate"
                  value={selectedEmployeeStats.avgHourlyRate}
                  prefix="$"
                  precision={2}
                  suffix="/hr"
                  size="small"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Entries"
                  value={selectedEmployeeStats.entryCount}
                  size="small"
                />
              </Col>
            </Row>

            {/* Labor History Table */}
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Labor History</Text>
            {selectedEmployeeStats.laborEntries.length > 0 ? (
              <Table
                columns={laborColumns}
                dataSource={selectedEmployeeStats.laborEntries}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5, size: 'small' }}
              />
            ) : (
              <Empty description="No labor entries recorded" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeesView;
