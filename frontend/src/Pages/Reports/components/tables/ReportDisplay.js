import React from "react";
import { Card, Button, Row, Col, Statistic, List, Typography, Divider } from "antd";
import { DownloadOutlined, UserOutlined, FileTextOutlined, ClockCircleOutlined, DollarOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ReportDisplay = ({ report, onExport }) => {
  if (!report) return null;

  const renderCustomerReport = () => (
    <div className="space-y-6">
      {/* Customer Information Card */}
      <Card 
        title={
          <span>
            <UserOutlined className="mr-2" />
            Customer Information
          </span>
        }
        className="shadow-sm"
      >
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Name:</Text>
            <div>{report.customer.name}</div>
          </Col>
          <Col span={8}>
            <Text strong>Email:</Text>
            <div>{report.customer.email}</div>
          </Col>
          <Col span={8}>
            <Text strong>Phone:</Text>
            <div>{report.customer.phone || "N/A"}</div>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Card 
        title={
          <span>
            <FileTextOutlined className="mr-2" />
            Summary Statistics
          </span>
        }
        className="shadow-sm"
      >
        <Row gutter={16}>
          <Col span={4}>
            <Statistic
              title="Total Jobs"
              value={report.summary.totalJobs}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Completed"
              value={report.summary.completedJobs}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="In Progress"
              value={report.summary.inProgressJobs}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Pending"
              value={report.summary.pendingJobs}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Est. Hours"
              value={report.summary.totalEstimatedHours}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ClockCircleOutlined />}
              suffix="h"
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Act. Hours"
              value={report.summary.totalActualHours}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<ClockCircleOutlined />}
              suffix="h"
            />
          </Col>
        </Row>
      </Card>

      {/* Jobs List */}
      <Card 
        title={
          <span>
            <FileTextOutlined className="mr-2" />
            Jobs List
          </span>
        }
        className="shadow-sm"
      >
        <List
          dataSource={report.jobs}
          renderItem={(job) => (
            <List.Item>
              <List.Item.Meta
                title={job.title}
                description={`Status: ${job.status}`}
              />
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  Est: {job.estimatedHours}h
                </div>
                <div className="text-sm text-gray-600">
                  Act: {job.actualHours}h
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  const renderJobReport = () => (
    <div className="space-y-6">
      {/* Job Information Card */}
      <Card 
        title={
          <span>
            <FileTextOutlined className="mr-2" />
            Job Information
          </span>
        }
        className="shadow-sm"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Title:</Text>
            <div>{report.job.title}</div>
          </Col>
          <Col span={12}>
            <Text strong>Customer:</Text>
            <div>{report.job.customerName}</div>
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Status:</Text>
            <div>{report.job.status}</div>
          </Col>
          <Col span={8}>
            <Text strong>Start Date:</Text>
            <div>{report.job.startDate}</div>
          </Col>
          <Col span={8}>
            <Text strong>End Date:</Text>
            <div>{report.job.endDate}</div>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Card 
        title={
          <span>
            <FileTextOutlined className="mr-2" />
            Job Summary
          </span>
        }
        className="shadow-sm"
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Estimated Hours"
              value={report.summary.estimatedHours}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
              suffix="h"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Actual Hours"
              value={report.summary.actualHours}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ClockCircleOutlined />}
              suffix="h"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Efficiency"
              value={report.summary.efficiency}
              valueStyle={{ color: '#faad14' }}
              suffix="%"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Duration"
              value={report.summary.duration}
              valueStyle={{ color: '#722ed1' }}
              suffix="days"
            />
          </Col>
        </Row>
      </Card>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="mb-0">
          {report.type}
        </Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onExport}
          size="large"
        >
          Export Report
        </Button>
      </div>

      {report.type === "Customer Report" && renderCustomerReport()}
      {report.type === "Job Report" && renderJobReport()}
    </div>
  );
};

export default ReportDisplay;
