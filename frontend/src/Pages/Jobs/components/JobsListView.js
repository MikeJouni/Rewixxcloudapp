import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Spin, Drawer, Form, DatePicker, InputNumber, Switch, Divider, Card, Row, Col, Grid, Table, Segmented, Tooltip, message } from "antd";
import { PlusOutlined, SearchOutlined, CloseOutlined, DeleteOutlined, FileDoneOutlined, FormOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../AuthContext";
import * as accountSettingsService from "../../../services/accountSettingsService";
import JobTable from "./tables/JobTable";
import JobDetailModal from "./modals/JobDetailModal";
import ReceiptTableModal from "./modals/ReceiptTableModal";
import InvoicePreview from "../../Invoices/components/InvoicePreview";
import { generateInvoicePDF } from "../../Invoices/utils/invoicePdfGenerator";
import useJobs from "../hooks/useJobs";
import dayjs from "dayjs";

const { TextArea } = Input;
const { useBreakpoint } = Grid;

const JobsListView = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [invoiceForm] = Form.useForm();
  const [invoiceDrawerVisible, setInvoiceDrawerVisible] = useState(false);
  const [invoiceJob, setInvoiceJob] = useState(null);
  const [invoicePreviewData, setInvoicePreviewData] = useState(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const [invoiceIncludeTax, setInvoiceIncludeTax] = useState(false);
  const [invoiceMobileTab, setInvoiceMobileTab] = useState("form");
  const [invoiceIncludeScope, setInvoiceIncludeScope] = useState(false);
  const [showItemizedList, setShowItemizedList] = useState(true);
  const [manualScopeOfWork, setManualScopeOfWork] = useState("");
  const lineItemKeyRef = useRef(1);

  const { token } = useAuth();

  // Fetch account settings for invoice
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token,
  });

  const {
    filteredJobs,
    isLoading,
    processingReceiptJobId,
    searchTerm,
    setSearchTerm,
    selectedJobForDetails,
    setSelectedJobForDetails,
    showJobDetailModal,
    setShowJobDetailModal,
    deleteJob,
    updateJob,
    handleReceiptUpload,
    viewJobDetails,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    hasNext,
    hasPrevious,
    products,
    productsLoading,
    productsError,
    addMaterialToJob,
    updateMaterialInJob,
    // Receipt-related functions
    setProcessingReceiptJobId,
    showVerificationModal,
    setShowVerificationModal,
    currentReceiptData,
    handleReceiptVerification,
    removeReceipt,
    clearAllReceipts,
    // Material removal function
    removeMaterialFromJob,
  } = useJobs();

  // Invoice line items calculations
  const invoiceSubtotal = useMemo(() => {
    return invoiceLineItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  }, [invoiceLineItems]);

  const invoiceTaxAmount = invoiceIncludeTax ? invoiceSubtotal * 0.06 : 0;
  const invoiceGrandTotal = invoiceSubtotal + invoiceTaxAmount;

  // Handle opening invoice drawer for a standalone invoice (no job)
  const handleCreateStandaloneInvoice = () => {
    setInvoiceJob(null);
    setInvoiceDrawerVisible(true);
    setInvoiceMobileTab("form");

    // Start with one empty line item
    lineItemKeyRef.current = 2;
    setInvoiceLineItems([{ key: 1, description: "", quantity: 1, unitPrice: 0 }]);
    setInvoiceIncludeTax(false);
    setInvoiceIncludeScope(false);

    // Pre-fill form with defaults
    setTimeout(() => {
      invoiceForm.setFieldsValue({
        invoiceDate: dayjs(),
        paymentTerms: "Due upon receipt",
        customerName: "",
        customerAddress: "",
        customerPhone: "",
        customerEmail: "",
      });

      // Update preview
      updateInvoicePreview();
    }, 100);
  };

  // Handle opening invoice drawer for a job
  const handleCreateInvoice = (job) => {
    setInvoiceJob(job);
    setInvoiceDrawerVisible(true);
    setInvoiceMobileTab("form");

    // Calculate total cost from job
    const materialCost = job.customMaterialCost || 0;
    const jobPrice = job.jobPrice || 0;
    const subtotal = materialCost + jobPrice;

    // Create line items from job data
    const items = [];
    let keyCounter = 1;

    if (jobPrice > 0) {
      items.push({
        key: keyCounter++,
        description: job.title || "Labor",
        quantity: 1,
        unitPrice: jobPrice,
      });
    }

    if (materialCost > 0) {
      items.push({
        key: keyCounter++,
        description: "Materials",
        quantity: 1,
        unitPrice: materialCost,
      });
    }

    if (items.length === 0) {
      items.push({ key: keyCounter++, description: "", quantity: 1, unitPrice: 0 });
    }

    lineItemKeyRef.current = keyCounter;
    setInvoiceLineItems(items);
    setInvoiceIncludeTax(job.includeTax || false);

    // Build customer address
    const customer = job.customer;
    const fullAddress = customer ? [
      customer.addressLine1,
      customer.addressLine2,
      customer.city,
      customer.state,
      customer.zip
    ].filter(Boolean).join(", ") : "";

    // Pre-fill form
    setTimeout(() => {
      invoiceForm.setFieldsValue({
        invoiceDate: dayjs(),
        paymentTerms: "Due upon receipt",
        customerName: customer?.name || job.customerName || "",
        customerAddress: fullAddress,
        customerPhone: customer?.phone || "",
        customerEmail: customer?.email || "",
      });

      // Update preview
      updateInvoicePreview();
    }, 100);
  };

  // Update invoice preview data
  const updateInvoicePreview = useCallback(() => {
    const values = invoiceForm.getFieldsValue();
    setInvoicePreviewData({
      companyName: accountSettings?.companyName,
      companyAddress: accountSettings?.address,
      companyPhone: accountSettings?.phone,
      companyEmail: accountSettings?.email,
      logoUrl: accountSettings?.logoUrl,
      customerName: values.customerName,
      customerAddress: values.customerAddress,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone,
      invoiceNumber: values.invoiceNumber,
      invoiceDate: values.invoiceDate?.format("YYYY-MM-DD"),
      dueDate: values.dueDate?.format("YYYY-MM-DD"),
      paymentTerms: values.paymentTerms,
      lineItems: invoiceLineItems,
      subtotal: invoiceSubtotal,
      taxAmount: invoiceTaxAmount,
      grandTotal: invoiceGrandTotal,
      includeTax: invoiceIncludeTax,
      notes: values.notes,
      scopeOfWork: invoiceJob ? (invoiceIncludeScope ? invoiceJob?.description : null) : (manualScopeOfWork || null),
      showItemizedList: showItemizedList,
    });
  }, [accountSettings, invoiceForm, invoiceLineItems, invoiceSubtotal, invoiceTaxAmount, invoiceGrandTotal, invoiceIncludeTax, invoiceIncludeScope, invoiceJob, showItemizedList, manualScopeOfWork]);

  // Auto-update preview when scope toggle, tax toggle, itemized toggle, or manual scope changes
  useEffect(() => {
    if (invoiceDrawerVisible) {
      updateInvoicePreview();
    }
  }, [invoiceIncludeScope, invoiceIncludeTax, showItemizedList, manualScopeOfWork, invoiceDrawerVisible, updateInvoicePreview]);

  // Handle invoice form value changes
  const handleInvoiceValuesChange = () => {
    updateInvoicePreview();
  };

  // Close invoice drawer
  const handleCloseInvoiceDrawer = () => {
    setInvoiceDrawerVisible(false);
    invoiceForm.resetFields();
    setInvoicePreviewData(null);
    setInvoiceJob(null);
    setInvoiceLineItems([]);
    setInvoiceIncludeTax(false);
    setInvoiceIncludeScope(false);
    setShowItemizedList(true);
    setManualScopeOfWork("");
    setInvoiceMobileTab("form");
  };

  // Add line item
  const addInvoiceLineItem = () => {
    setInvoiceLineItems([
      ...invoiceLineItems,
      { key: lineItemKeyRef.current++, description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  // Remove line item
  const removeInvoiceLineItem = (key) => {
    setInvoiceLineItems(invoiceLineItems.filter((item) => item.key !== key));
  };

  // Update line item
  const updateInvoiceLineItem = (key, field, value) => {
    setInvoiceLineItems(
      invoiceLineItems.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
    setTimeout(updateInvoicePreview, 0);
  };

  // Download PDF
  const handleInvoiceDownloadPDF = async () => {
    const values = invoiceForm.getFieldsValue();
    const invoiceData = {
      companyName: accountSettings?.companyName,
      companyAddress: accountSettings?.address,
      companyPhone: accountSettings?.phone,
      companyEmail: accountSettings?.email,
      logoUrl: accountSettings?.logoUrl,
      customerName: values.customerName,
      customerAddress: values.customerAddress,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone,
      invoiceNumber: values.invoiceNumber,
      invoiceDate: values.invoiceDate?.format("YYYY-MM-DD"),
      dueDate: values.dueDate?.format("YYYY-MM-DD"),
      paymentTerms: values.paymentTerms,
      lineItems: invoiceLineItems,
      subtotal: invoiceSubtotal,
      taxAmount: invoiceTaxAmount,
      grandTotal: invoiceGrandTotal,
      includeTax: invoiceIncludeTax,
      notes: values.notes,
      scopeOfWork: invoiceJob ? (invoiceIncludeScope ? invoiceJob?.description : null) : (manualScopeOfWork || null),
      showItemizedList: showItemizedList,
    };
    await generateInvoicePDF(invoiceData, accountSettings);
  };

  // Line item columns for desktop table
  const invoiceLineItemColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (_, record) => (
        <Input
          value={record.description}
          onChange={(e) => updateInvoiceLineItem(record.key, "description", e.target.value)}
          placeholder="Item description"
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => updateInvoiceLineItem(record.key, "quantity", value)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={0}
          step={0.01}
          precision={2}
          value={record.unitPrice}
          onChange={(value) => updateInvoiceLineItem(record.key, "unitPrice", value)}
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
        <span className="font-semibold">
          ${((record.quantity || 0) * (record.unitPrice || 0)).toFixed(2)}
        </span>
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
          onClick={() => removeInvoiceLineItem(record.key)}
          disabled={invoiceLineItems.length === 1}
        />
      ),
    },
  ];

  // Mobile line item card component
  const InvoiceLineItemCard = ({ item, index }) => (
    <Card
      size="small"
      className="mb-3"
      style={{ background: "#fafafa" }}
      extra={
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeInvoiceLineItem(item.key)}
          disabled={invoiceLineItems.length === 1}
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
            onChange={(e) => updateInvoiceLineItem(item.key, "description", e.target.value)}
            placeholder="Item description"
          />
        </div>
        <Row gutter={12}>
          <Col span={8}>
            <label className="text-xs text-gray-500 mb-1 block">Qty</label>
            <InputNumber
              min={1}
              value={item.quantity}
              onChange={(value) => updateInvoiceLineItem(item.key, "quantity", value)}
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
              onChange={(value) => updateInvoiceLineItem(item.key, "unitPrice", value)}
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
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Job Management
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            size="large"
            icon={<FileDoneOutlined />}
            onClick={() => handleCreateStandaloneInvoice()}
            className="flex-1 sm:flex-none"
          >
            Create Invoice
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate("/jobs/create")}
            className="flex-1 sm:flex-none"
            style={{
              background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
              border: 'none',
            }}
          >
            Add New Job
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <Input
          size="large"
          placeholder="Search jobs by title or customer name..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ borderRadius: '8px' }}
        />
      </div>

      {/* Jobs Table - Responsive Container */}
      {isLoading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-3 text-gray-600 text-lg">Loading jobs...</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
          <JobTable
            jobs={filteredJobs}
            onViewDetails={viewJobDetails}
            onEdit={updateJob.mutateAsync}
            onDelete={(id) => deleteJob.mutate(id)}
            onCreateInvoice={handleCreateInvoice}
          />
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevious}
            size="small"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={!hasNext}
            size="small"
          >
            Next
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm">
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => {
              setPage(0);
              setPageSize(Number(e.target.value));
            }}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Modals */}
      <ReceiptTableModal
        key={currentReceiptData?.receipt_id || Date.now()}
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        receiptData={currentReceiptData}
        onVerify={handleReceiptVerification}
      />

  {showJobDetailModal && selectedJobForDetails && (
    <JobDetailModal
      job={selectedJobForDetails}
          isOpen={showJobDetailModal}
          onClose={() => {
            setShowJobDetailModal(false);
            setSelectedJobForDetails(null);
          }}
          onUpdateJob={updateJob.mutateAsync}
          onRemoveReceipt={removeReceipt}
          onClearAllReceipts={clearAllReceipts}
          onRemoveMaterial={removeMaterialFromJob.mutateAsync}
          onUpdateMaterial={updateMaterialInJob.mutateAsync}
          onAddMaterial={addMaterialToJob.mutateAsync}
          onAddReceipt={handleReceiptUpload}
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
          showReceiptLoading={processingReceiptJobId === selectedJobForDetails?.id}
          setShowReceiptLoading={(show) => {
            if (!show) {
              // Reset processing state when loading is hidden
              setProcessingReceiptJobId(null);
            }
          }}
          onCompleteJob={async (jobId) => {
            const today = new Date().toISOString().split('T')[0];
            const updatedJob = {
              ...selectedJobForDetails,
              status: "COMPLETED",
              endDate: today
            };
            setSelectedJobForDetails(updatedJob);
            await updateJob.mutateAsync({ 
              id: jobId, 
              status: "COMPLETED", 
              endDate: today 
            });
          }}
        />
      )}

      {/* Invoice Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FileDoneOutlined />
            <span>Create Invoice</span>
            {invoiceJob && <span className="text-gray-500 text-sm">- {invoiceJob.title}</span>}
          </div>
        }
        placement="right"
        width={isMobile ? "100%" : "90%"}
        open={invoiceDrawerVisible}
        onClose={handleCloseInvoiceDrawer}
        closable={false}
        extra={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Tooltip title="Download as PDF">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleInvoiceDownloadPDF}
                size={isMobile ? "middle" : "middle"}
                style={{ background: '#1f2937' }}
              >
                {!isMobile && "Download PDF"}
              </Button>
            </Tooltip>
            <Button
              icon={<CloseOutlined />}
              onClick={handleCloseInvoiceDrawer}
              size={isMobile ? "middle" : "middle"}
            />
          </div>
        }
      >
        {isMobile ? (
          <>
            <Segmented
              block
              options={[
                { label: "Form", value: "form", icon: <FormOutlined /> },
                { label: "Preview", value: "preview", icon: <EyeOutlined /> },
              ]}
              value={invoiceMobileTab}
              onChange={setInvoiceMobileTab}
              className="mb-4"
            />
            {invoiceMobileTab === "form" ? (
              <div className="pb-20">
                <Form
                  form={invoiceForm}
                  layout="vertical"
                  onValuesChange={handleInvoiceValuesChange}
                >
                  <Divider orientation="left">Invoice Details</Divider>
                  <Form.Item label="Invoice Number" name="invoiceNumber">
                    <Input placeholder="INV-0001 (optional)" />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Invoice Date" name="invoiceDate">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Due Date" name="dueDate">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="Payment Terms" name="paymentTerms">
                    <Input placeholder="Due upon receipt" />
                  </Form.Item>

                  <Divider orientation="left">Customer Information</Divider>
                  <Form.Item label="Customer Name" name="customerName">
                    <Input />
                  </Form.Item>
                  <Form.Item label="Address" name="customerAddress">
                    <Input />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Phone" name="customerPhone">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Email" name="customerEmail">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-700">Invoice Display Mode:</span>
                        <p className="text-xs text-gray-500 mt-1">
                          {showItemizedList ? "Shows individual line items with quantities and prices" : "Shows only the total amount due"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!showItemizedList ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>Total Only</span>
                        <Switch
                          checked={showItemizedList}
                          onChange={(checked) => setShowItemizedList(checked)}
                        />
                        <span className={`text-sm ${showItemizedList ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>Itemized</span>
                      </div>
                    </div>
                  </div>

                  <Divider orientation="left">Line Items</Divider>
                  {invoiceLineItems.map((item, index) => (
                    <InvoiceLineItemCard key={item.key} item={item} index={index} />
                  ))}
                  <Button
                    type="dashed"
                    onClick={addInvoiceLineItem}
                    block
                    icon={<PlusOutlined />}
                    className="mb-4"
                  >
                    Add Line Item
                  </Button>

                  <Card size="small" className="mb-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">${invoiceSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          Include Tax (6%):
                          <Switch
                            size="small"
                            checked={invoiceIncludeTax}
                            onChange={(checked) => setInvoiceIncludeTax(checked)}
                          />
                        </span>
                        <span className="font-semibold">${invoiceTaxAmount.toFixed(2)}</span>
                      </div>
                      <Divider style={{ margin: "8px 0" }} />
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-green-600">${invoiceGrandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>

                  <Card size="small" className="mb-4">
                    {invoiceJob ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Include Scope of Work:</span>
                          <Switch
                            size="small"
                            checked={invoiceIncludeScope}
                            disabled={!invoiceJob?.description}
                            onChange={(checked) => setInvoiceIncludeScope(checked)}
                          />
                        </div>
                        {!invoiceJob.description ? (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                            This job has no description. Add a description in the job details to include it here.
                          </div>
                        ) : invoiceIncludeScope ? (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700 whitespace-pre-wrap border border-blue-200">
                            {invoiceJob.description}
                          </div>
                        ) : (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-500">
                            Toggle on to include job description in the invoice
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-gray-700 mb-2">Scope of Work:</div>
                        <TextArea
                          rows={4}
                          placeholder="Enter scope of work or project description..."
                          value={manualScopeOfWork}
                          onChange={(e) => setManualScopeOfWork(e.target.value)}
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          Optional - describe the work performed for this invoice
                        </div>
                      </>
                    )}
                  </Card>

                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea rows={3} placeholder="Additional notes..." />
                  </Form.Item>

                  {/* Mobile Action Button */}
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleInvoiceDownloadPDF}
                      size="large"
                      block
                      style={{ background: '#1f2937' }}
                    >
                      Download PDF
                    </Button>
                  </div>
                </Form>
              </div>
            ) : (
              <InvoicePreview data={invoicePreviewData} accountSettings={accountSettings} isMobile={true} />
            )}
          </>
        ) : (
          <Row gutter={24}>
            <Col span={12}>
              <div style={{ maxHeight: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 16 }}>
                <Form
                  form={invoiceForm}
                  layout="vertical"
                  onValuesChange={handleInvoiceValuesChange}
                >
                  <Divider orientation="left">Invoice Details</Divider>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Invoice Number" name="invoiceNumber">
                        <Input placeholder="INV-0001" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Invoice Date" name="invoiceDate">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Due Date" name="dueDate">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="Payment Terms" name="paymentTerms">
                    <Input placeholder="Due upon receipt" />
                  </Form.Item>

                  <Divider orientation="left">Customer Information</Divider>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Customer Name" name="customerName">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Address" name="customerAddress">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Phone" name="customerPhone">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Email" name="customerEmail">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-700">Invoice Display Mode:</span>
                        <p className="text-xs text-gray-500 mt-1">
                          {showItemizedList ? "Shows individual line items with quantities and prices" : "Shows only the total amount due"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!showItemizedList ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>Total Only</span>
                        <Switch
                          checked={showItemizedList}
                          onChange={(checked) => setShowItemizedList(checked)}
                        />
                        <span className={`text-sm ${showItemizedList ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>Itemized</span>
                      </div>
                    </div>
                  </div>

                  <Divider orientation="left">Line Items</Divider>
                  <Table
                    dataSource={invoiceLineItems}
                    columns={invoiceLineItemColumns}
                    pagination={false}
                    size="small"
                    className="mb-4"
                  />
                  <Button
                    type="dashed"
                    onClick={addInvoiceLineItem}
                    block
                    icon={<PlusOutlined />}
                    className="mb-4"
                  >
                    Add Line Item
                  </Button>

                  <Card size="small" className="mb-4">
                    <Row gutter={16} align="middle">
                      <Col span={12}>
                        <div className="flex items-center gap-3">
                          <span>Include Tax (6%):</span>
                          <Switch
                            checked={invoiceIncludeTax}
                            onChange={(checked) => setInvoiceIncludeTax(checked)}
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="text-right space-y-1">
                          <div>Subtotal: <span className="font-semibold">${invoiceSubtotal.toFixed(2)}</span></div>
                          {invoiceIncludeTax && (
                            <div>Tax (6%): <span className="font-semibold">${invoiceTaxAmount.toFixed(2)}</span></div>
                          )}
                          <div className="text-lg">
                            <span className="font-bold">Total: </span>
                            <span className="font-bold text-green-600">${invoiceGrandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  <Card size="small" className="mb-4">
                    {invoiceJob ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Include Scope of Work (Job Description):</span>
                          <Switch
                            checked={invoiceIncludeScope}
                            disabled={!invoiceJob?.description}
                            onChange={(checked) => setInvoiceIncludeScope(checked)}
                          />
                        </div>
                        {!invoiceJob.description ? (
                          <div className="p-3 bg-yellow-50 rounded text-sm text-yellow-700">
                            This job has no description. Add a description in the job details to include it here.
                          </div>
                        ) : invoiceIncludeScope ? (
                          <div className="p-3 bg-blue-50 rounded text-sm text-gray-700 whitespace-pre-wrap border border-blue-200">
                            {invoiceJob.description}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded text-sm text-gray-500">
                            Toggle on to include job description in the invoice
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-gray-700 mb-2">Scope of Work:</div>
                        <TextArea
                          rows={4}
                          placeholder="Enter scope of work or project description..."
                          value={manualScopeOfWork}
                          onChange={(e) => setManualScopeOfWork(e.target.value)}
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          Optional - describe the work performed for this invoice
                        </div>
                      </>
                    )}
                  </Card>

                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea rows={3} placeholder="Additional notes..." />
                  </Form.Item>

                  {/* Desktop Action Button */}
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleInvoiceDownloadPDF}
                      size="large"
                      style={{ background: '#1f2937' }}
                    >
                      Download PDF
                    </Button>
                  </div>
                </Form>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ position: "sticky", top: 0 }}>
                <InvoicePreview data={invoicePreviewData} accountSettings={accountSettings} />
              </div>
            </Col>
          </Row>
        )}
      </Drawer>
    </div>
  );
};

export default JobsListView;
