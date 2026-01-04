import React, { useState, useRef } from "react";
import {
  Card,
  Button,
  Form,
  Drawer,
  message,
  Grid,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Divider,
  Typography,
  Table,
  Space,
  Segmented,
} from "antd";
import {
  FileTextOutlined,
  PlusOutlined,
  DownloadOutlined,
  CloseOutlined,
  DeleteOutlined,
  SearchOutlined,
  FormOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import * as accountSettingsService from "../../services/accountSettingsService";
import * as customerService from "../Customers/services/customerService";
import * as jobService from "../Jobs/services/jobService";
import { useAuth } from "../../AuthContext";
import InvoicePreview from "./components/InvoicePreview";
import { generateInvoicePDF } from "./utils/invoicePdfGenerator";
import dayjs from "dayjs";

const { useBreakpoint } = Grid;
const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

const InvoicesPage = () => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [lineItems, setLineItems] = useState([
    { key: 1, description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [includeTax, setIncludeTax] = useState(false);
  const screens = useBreakpoint();
  const lineItemKeyRef = useRef(2);
  const [mobileTab, setMobileTab] = useState("form");

  const { token } = useAuth();

  // Fetch account settings
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token,
  });

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customerService.getCustomersList({ pageSize: 1000 }),
    enabled: !!token,
  });
  const customers = customersData?.customers || [];

  // Fetch jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs", "all"],
    queryFn: () => jobService.getJobsList({ pageSize: 1000 }),
    enabled: !!token,
  });
  const allJobs = jobsData?.jobs || [];

  // Calculate totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  const taxAmount = includeTax ? subtotal * 0.06 : 0;
  const grandTotal = subtotal + taxAmount;

  const updatePreview = () => {
    const values = form.getFieldsValue();
    setPreviewData({
      ...values,
      companyName: accountSettings?.companyName,
      companyAddress: accountSettings?.address,
      companyPhone: accountSettings?.phone,
      companyEmail: accountSettings?.email,
      logoUrl: accountSettings?.logoUrl,
      lineItems,
      subtotal,
      taxAmount,
      grandTotal,
      includeTax,
      invoiceDate: values.invoiceDate
        ? values.invoiceDate.format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      dueDate: values.dueDate
        ? values.dueDate.format("YYYY-MM-DD")
        : null,
    });
  };

  const handleValuesChange = () => {
    updatePreview();
  };

  const handleOpenDrawer = () => {
    setDrawerVisible(true);
    form.setFieldsValue({
      invoiceDate: dayjs(),
      paymentTerms: "Due upon receipt",
    });
    setLineItems([{ key: 1, description: "", quantity: 1, unitPrice: 0 }]);
    setIncludeTax(false);
    setTimeout(updatePreview, 100);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    form.resetFields();
    setPreviewData(null);
    setSelectedCustomer(null);
    setSelectedJob(null);
    setLineItems([{ key: 1, description: "", quantity: 1, unitPrice: 0 }]);
    setIncludeTax(false);
    lineItemKeyRef.current = 2;
    setMobileTab("form");
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      const fullAddress = [
        customer.addressLine1,
        customer.addressLine2,
        customer.city,
        customer.state,
        customer.zip,
      ]
        .filter(Boolean)
        .join(", ");

      form.setFieldsValue({
        customerName: customer.name,
        customerAddress: fullAddress,
        customerEmail: customer.username,
        customerPhone: customer.phone,
      });
      updatePreview();
    }
  };

  const handleJobSelect = (jobId) => {
    const job = allJobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setIncludeTax(job.includeTax || false);

      // Create line items from job
      const newLineItems = [];
      let keyCounter = 1;

      // Add job price as a line item if exists
      if (job.jobPrice && job.jobPrice > 0) {
        newLineItems.push({
          key: keyCounter++,
          description: `Labor - ${job.title}`,
          quantity: 1,
          unitPrice: job.jobPrice,
        });
      }

      // Add material cost if exists
      if (job.customMaterialCost && job.customMaterialCost > 0) {
        newLineItems.push({
          key: keyCounter++,
          description: "Materials",
          quantity: 1,
          unitPrice: job.customMaterialCost,
        });
      }

      // If no items, add a default one
      if (newLineItems.length === 0) {
        newLineItems.push({
          key: keyCounter++,
          description: job.title || "",
          quantity: 1,
          unitPrice: 0,
        });
      }

      setLineItems(newLineItems);
      lineItemKeyRef.current = keyCounter;

      // Set customer info from job
      if (job.customer) {
        setSelectedCustomer(job.customer);
        const fullAddress = [
          job.customer.addressLine1,
          job.customer.addressLine2,
          job.customer.city,
          job.customer.state,
          job.customer.zip,
        ]
          .filter(Boolean)
          .join(", ");

        form.setFieldsValue({
          customerName: job.customer.name,
          customerAddress: fullAddress,
          customerEmail: job.customer.username,
          customerPhone: job.customer.phone,
        });
      }

      setTimeout(updatePreview, 100);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        key: lineItemKeyRef.current++,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeLineItem = (key) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.key !== key));
      setTimeout(updatePreview, 50);
    }
  };

  const updateLineItem = (key, field, value) => {
    setLineItems(
      lineItems.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
    setTimeout(updatePreview, 50);
  };

  const handleDownloadPDF = async () => {
    const values = form.getFieldsValue();

    if (!values.customerName) {
      message.error("Please select a customer first");
      return;
    }

    const invoiceData = {
      ...values,
      companyName: accountSettings?.companyName,
      companyAddress: accountSettings?.address,
      companyPhone: accountSettings?.phone,
      companyEmail: accountSettings?.email,
      logoUrl: accountSettings?.logoUrl,
      lineItems,
      subtotal,
      taxAmount,
      grandTotal,
      includeTax,
      invoiceDate: values.invoiceDate
        ? values.invoiceDate.format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      dueDate: values.dueDate ? values.dueDate.format("YYYY-MM-DD") : null,
    };

    try {
      message.loading({ content: "Generating PDF...", key: "pdf" });
      await generateInvoicePDF(invoiceData, accountSettings);
      message.success({ content: "PDF downloaded successfully!", key: "pdf" });
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error({ content: "Failed to generate PDF", key: "pdf" });
    }
  };

  const lineItemColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) =>
            updateLineItem(record.key, "description", e.target.value)
          }
          placeholder="Item description"
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      render: (text, record) => (
        <InputNumber
          min={1}
          value={text}
          onChange={(value) => updateLineItem(record.key, "quantity", value)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      render: (text, record) => (
        <InputNumber
          min={0}
          step={0.01}
          precision={2}
          value={text}
          onChange={(value) => updateLineItem(record.key, "unitPrice", value)}
          prefix="$"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Total",
      key: "total",
      width: 100,
      render: (_, record) => (
        <span>${((record.quantity || 0) * (record.unitPrice || 0)).toFixed(2)}</span>
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLineItem(record.key)}
          disabled={lineItems.length === 1}
        />
      ),
    },
  ];

  const isMobile = !screens.md;

  // Mobile-friendly line item card component
  const LineItemCard = ({ item, index }) => (
    <Card
      size="small"
      className="mb-3"
      style={{ background: "#fafafa" }}
      extra={
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLineItem(item.key)}
          disabled={lineItems.length === 1}
          style={{ minWidth: 44, minHeight: 44 }}
        />
      }
      title={<span style={{ fontSize: 14 }}>Item {index + 1}</span>}
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Description</label>
          <Input
            value={item.description}
            onChange={(e) => updateLineItem(item.key, "description", e.target.value)}
            placeholder="Item description"
          />
        </div>
        <Row gutter={12}>
          <Col span={8}>
            <label className="text-xs text-gray-500 mb-1 block">Qty</label>
            <InputNumber
              min={1}
              value={item.quantity}
              onChange={(value) => updateLineItem(item.key, "quantity", value)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={8}>
            <label className="text-xs text-gray-500 mb-1 block">Unit Price</label>
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              value={item.unitPrice}
              onChange={(value) => updateLineItem(item.key, "unitPrice", value)}
              prefix="$"
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={8}>
            <label className="text-xs text-gray-500 mb-1 block">Total</label>
            <div className="h-8 flex items-center font-semibold">
              ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );

  return (
    <div className="w-full h-full" style={{ padding: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Invoice Generator
          </Typography.Title>
          <Text type="secondary">
            Create professional invoices for your clients
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenDrawer}
        >
          Create Invoice
        </Button>
      </div>

      {/* Info Card */}
      <Card size="small">
        <div className="text-center py-8">
          <FileTextOutlined
            style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }}
          />
          <Typography.Title level={4} style={{ marginBottom: 8 }}>
            Generate Invoices on the Fly
          </Typography.Title>
          <Text type="secondary">
            Click "Create Invoice" to generate a professional invoice. You can
            link it to an existing job or create a standalone invoice. Invoices
            are generated as PDFs and are not stored in the database.
          </Text>
        </div>
      </Card>

      {/* Creation Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined style={{ fontSize: "20px" }} />
            <span style={{ fontSize: "18px", fontWeight: "600" }}>
              Create Invoice
            </span>
          </div>
        }
        placement="right"
        onClose={handleCloseDrawer}
        open={drawerVisible}
        width={isMobile ? "100%" : "90%"}
        closeIcon={<CloseOutlined />}
        footer={
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
          >
            <Button size="large" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>
          </div>
        }
        styles={{ body: { padding: isMobile ? "16px" : "24px" } }}
      >
        {/* Mobile Tab Toggle */}
        {isMobile && (
          <div className="mb-4">
            <Segmented
              block
              value={mobileTab}
              onChange={setMobileTab}
              options={[
                { label: <span><FormOutlined /> Form</span>, value: "form" },
                { label: <span><EyeOutlined /> Preview</span>, value: "preview" },
              ]}
              style={{ marginBottom: 8 }}
            />
          </div>
        )}

        <div className={isMobile ? "" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
          {/* Form Section */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: isMobile ? "calc(100vh - 240px)" : "calc(100vh - 180px)",
              display: isMobile && mobileTab !== "form" ? "none" : "block"
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleValuesChange}
              initialValues={{
                invoiceDate: dayjs(),
                paymentTerms: "Due upon receipt",
              }}
            >
              <Card title="Invoice Details" className="mb-4" size={isMobile ? "small" : "default"}>
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Invoice Number" name="invoiceNumber">
                      <Input placeholder="INV-001 (optional)" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Invoice Date" name="invoiceDate">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Due Date" name="dueDate">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Payment Terms" name="paymentTerms">
                      <Input placeholder="Due upon receipt" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Customer Information" className="mb-4" size={isMobile ? "small" : "default"}>
                <Form.Item label="Search Customer">
                  <Select
                    showSearch
                    size={isMobile ? "middle" : "large"}
                    placeholder={
                      customersLoading
                        ? "Loading..."
                        : "Search and select customer"
                    }
                    optionFilterProp="children"
                    onChange={handleCustomerSelect}
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                    suffixIcon={<SearchOutlined />}
                    allowClear
                    loading={customersLoading}
                  >
                    {customers.map((customer) => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.addressLine1}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Or Link to Job">
                  <Select
                    showSearch
                    size={isMobile ? "middle" : "large"}
                    placeholder={
                      jobsLoading ? "Loading..." : "Select job (optional)"
                    }
                    optionFilterProp="children"
                    onChange={handleJobSelect}
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                    suffixIcon={<SearchOutlined />}
                    allowClear
                    loading={jobsLoading}
                  >
                    {allJobs.map((job) => (
                      <Option key={job.id} value={job.id}>
                        {job.title} - {job.customer?.name || "No customer"}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Customer Name"
                      name="customerName"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Customer name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Customer Phone" name="customerPhone">
                      <Input placeholder="Phone" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="Customer Address" name="customerAddress">
                  <TextArea rows={isMobile ? 2 : 2} placeholder="Customer address" />
                </Form.Item>
                <Form.Item label="Customer Email" name="customerEmail">
                  <Input placeholder="Email" />
                </Form.Item>
              </Card>

              <Card title="Line Items" className="mb-4" size={isMobile ? "small" : "default"}>
                {/* Mobile: Card layout */}
                {isMobile ? (
                  <div>
                    {lineItems.map((item, index) => (
                      <LineItemCard key={item.key} item={item} index={index} />
                    ))}
                  </div>
                ) : (
                  /* Desktop: Table layout */
                  <Table
                    dataSource={lineItems}
                    columns={lineItemColumns}
                    pagination={false}
                    size="small"
                    rowKey="key"
                  />
                )}
                <Button
                  type="dashed"
                  onClick={addLineItem}
                  icon={<PlusOutlined />}
                  style={{ width: "100%", marginTop: 16, minHeight: 44 }}
                >
                  Add Line Item
                </Button>

                <Divider />

                <div className="flex items-center justify-between mb-2">
                  <span>Include Tax (6%)</span>
                  <Switch
                    checked={includeTax}
                    onChange={(checked) => {
                      setIncludeTax(checked);
                      setTimeout(updatePreview, 50);
                    }}
                  />
                </div>

                <div
                  style={{
                    background: "#fafafa",
                    padding: 16,
                    borderRadius: 4,
                  }}
                >
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Col>Subtotal:</Col>
                    <Col>
                      <strong>${subtotal.toFixed(2)}</strong>
                    </Col>
                  </Row>
                  {includeTax && (
                    <Row justify="space-between" style={{ marginBottom: 8 }}>
                      <Col>Tax (6%):</Col>
                      <Col>
                        <strong>${taxAmount.toFixed(2)}</strong>
                      </Col>
                    </Row>
                  )}
                  <Divider style={{ margin: "8px 0" }} />
                  <Row justify="space-between">
                    <Col>
                      <strong>Grand Total:</strong>
                    </Col>
                    <Col>
                      <strong style={{ fontSize: 18 }}>
                        ${grandTotal.toFixed(2)}
                      </strong>
                    </Col>
                  </Row>
                </div>
              </Card>

              <Card title="Notes" className="mb-4" size={isMobile ? "small" : "default"}>
                <Form.Item name="notes">
                  <TextArea
                    rows={isMobile ? 2 : 3}
                    placeholder="Additional notes or instructions..."
                  />
                </Form.Item>
              </Card>
            </Form>
          </div>

          {/* Preview Section */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: isMobile ? "calc(100vh - 240px)" : "calc(100vh - 180px)",
              display: isMobile && mobileTab !== "preview" ? "none" : "block"
            }}
          >
            <div className={isMobile ? "" : "sticky top-0"}>
              <InvoicePreview data={previewData} accountSettings={accountSettings} isMobile={isMobile} />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default InvoicesPage;
