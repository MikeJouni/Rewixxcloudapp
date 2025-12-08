import React, { useState, useMemo } from "react";
import { Card, Button, Form, Drawer, message, Grid, Row, Col, Statistic, Input, Select, Typography } from "antd";
import { FileTextOutlined, PlusOutlined, DownloadOutlined, CloseOutlined, SearchOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as accountSettingsService from "../../services/accountSettingsService";
import * as contractService from "./services/contractService";
import * as jobService from "../Jobs/services/jobService";
import * as customerService from "../Customers/services/customerService";
import { useAuth } from "../../AuthContext";
import ContractForm from "./components/ContractForm";
import ContractPreview from "./components/ContractPreview";
import ContractList from "./components/ContractList";
import { generateContractPDF } from "./utils/pdfGenerator";
import dayjs from "dayjs";

const { useBreakpoint } = Grid;
const { Option } = Select;
const { Text } = Typography;

const ContractsPage = () => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const screens = useBreakpoint();
  const queryClient = useQueryClient();

  // Fetch account settings
  const { token } = useAuth();
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token,
  });

  // Fetch contracts list
  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: ["contracts", token],
    queryFn: () => contractService.getContractsList({ pageSize: 100 }),
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Retry failed requests once
  });

  const contracts = contractsData?.contracts || [];

  // Filter contracts based on search and status
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        !searchTerm ||
        contract.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.scopeOfWork?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || contract.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = contracts.length;
    const paid = contracts.filter((c) => c.status === "PAID").length;
    const unpaid = contracts.filter((c) => c.status === "UNPAID").length;
    const totalValue = contracts.reduce(
      (sum, c) => sum + (parseFloat(c.totalPrice) || 0),
      0
    );
    return { total, paid, unpaid, totalValue };
  }, [contracts]);

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: contractService.createContract,
    onSuccess: () => {
      message.success("Contract saved successfully!");
      queryClient.invalidateQueries(["contracts"]);
      handleCloseDrawer();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || "Failed to save contract");
    },
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }) => contractService.updateContract(id, data),
    onSuccess: () => {
      message.success("Contract updated successfully!");
      queryClient.invalidateQueries(["contracts"]);
      handleCloseDrawer();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || "Failed to update contract");
    },
  });

  const handleValuesChange = () => {
    // Update preview in real-time - no required fields needed
    const values = form.getFieldsValue();
    setPreviewData({
      ...values,
      date: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
    });
  };

  const handleOpenDrawer = () => {
    setDrawerVisible(true);
    // Initialize preview with default form values immediately
    setTimeout(() => {
      const values = form.getFieldsValue();
      setPreviewData({
        ...values,
        date: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      });
    }, 100);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    form.resetFields();
    setPreviewData(null);
    setSelectedCustomer(null);
    setSelectedJob(null);
    setEditingContract(null);
  };

  // Handle editing a contract
  const handleEditContract = async (contract) => {
    setEditingContract(contract);
    setDrawerVisible(true);

    // If contract has a job, fetch and set it
    if (contract.jobId || contract.job?.id) {
      const jobId = contract.jobId || contract.job?.id;
      try {
        const jobs = await jobService.getJobsList({ pageSize: 1000 });
        const job = jobs.jobs?.find(j => j.id === jobId);
        if (job) {
          setSelectedJob(job);
        }
      } catch (error) {
        console.error("Error fetching job for contract:", error);
      }
    }

    // If contract has a customer, set it
    if (contract.customerId || contract.customer?.id) {
      const customerId = contract.customerId || contract.customer?.id;
      try {
        const customersResponse = await customerService.getCustomersList({ pageSize: 1000 });
        const customer = customersResponse.customers?.find(c => c.id === customerId);
        if (customer) {
          setSelectedCustomer(customer);
        }
      } catch (error) {
        console.error("Error fetching customer for contract:", error);
      }
    }

    // Pre-fill the form with contract data
    setTimeout(() => {
      form.setFieldsValue({
        companyName: contract.companyName,
        companyAddress: contract.companyAddress,
        companyPhone: contract.companyPhone,
        companyEmail: contract.companyEmail,
        licenseNumber: contract.licenseNumber,
        idNumber: contract.idNumber,
        customerName: contract.customerName,
        customerAddress: contract.customerAddress,
        date: contract.contractDate ? dayjs(contract.contractDate) : dayjs(),
        scopeOfWork: contract.scopeOfWork,
        totalPrice: contract.totalPrice,
        warranty: contract.warranty,
        depositPercent: contract.depositPercent,
        paymentMethods: contract.paymentMethods,
        status: contract.status || "UNPAID",
      });

      // Trigger preview update
      setPreviewData({
        ...contract,
        date: contract.contractDate || contract.date,
      });
    }, 100);
  };

  // Handle PDF download
  const handleDownloadPDF = async (contract) => {
    try {
      message.loading({ content: "Generating PDF...", key: "pdf" });
      await generateContractPDF(contract, accountSettings);
      message.success({ content: "PDF downloaded successfully!", key: "pdf" });
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error({ content: "Failed to generate PDF", key: "pdf" });
    }
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      const contractData = {
        companyName: values.companyName,
        companyAddress: values.companyAddress,
        companyPhone: values.companyPhone,
        companyEmail: values.companyEmail,
        licenseNumber: values.licenseNumber,
        idNumber: values.idNumber,
        customerName: values.customerName,
        customerAddress: values.customerAddress,
        customerId: selectedCustomer?.id || editingContract?.customerId,
        jobId: selectedJob?.id || editingContract?.jobId,
        date: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        scopeOfWork: values.scopeOfWork,
        totalPrice: values.totalPrice,
        warranty: values.warranty,
        depositPercent: values.depositPercent,
        paymentMethods: values.paymentMethods,
        status: values.status,
      };

      if (editingContract) {
        updateContractMutation.mutate({ id: editingContract.id, data: contractData });
      } else {
        createContractMutation.mutate(contractData);
      }
    } catch (error) {
      message.error("Please fill in all required fields");
    }
  };

  const handleDownload = () => {
    const values = form.getFieldsValue();
    const contractData = {
      ...values,
      date: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
    };
    handleDownloadPDF(contractData);
  };

  const isMobile = !screens.md;

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
            Contract Management
          </Typography.Title>
          <Text type="secondary">Create and manage professional contracts</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleOpenDrawer}
        >
          Create Contract
        </Button>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Contracts"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Paid"
              value={stats.paid}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Unpaid"
              value={stats.unpaid}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={12}>
            <Input
              size="large"
              placeholder="Search by customer name, scope of work..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Select
              size="large"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
            >
              <Option value="All">All Statuses</Option>
              <Option value="PAID">Paid</Option>
              <Option value="UNPAID">Unpaid</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Contracts List */}
      <Card size="small">
        <ContractList
          contracts={filteredContracts}
          onEdit={handleEditContract}
          onDownload={handleDownloadPDF}
          isLoading={contractsLoading}
        />
      </Card>

      {/* Creation Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined style={{ fontSize: "20px" }} />
            <span style={{ fontSize: "18px", fontWeight: "600" }}>
              {editingContract ? "Edit Contract" : "Create Contract"}
            </span>
          </div>
        }
        placement="right"
        onClose={handleCloseDrawer}
        open={drawerVisible}
        width={isMobile ? "100%" : "85%"}
        closeIcon={<CloseOutlined />}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <Button size="large" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button
              type="default"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSave}
              loading={createContractMutation.isLoading || updateContractMutation.isLoading}
            >
              {editingContract ? "Update Document" : "Save Document"}
            </Button>
          </div>
        }
        styles={{ body: { padding: "24px" } }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <Card title="Document Details" className="mb-4">
              <ContractForm
                form={form}
                onValuesChange={handleValuesChange}
                setSelectedCustomer={setSelectedCustomer}
                setSelectedJob={setSelectedJob}
                isOpen={drawerVisible}
                selectedCustomer={selectedCustomer}
                selectedJob={selectedJob}
              />
            </Card>
          </div>

          {/* Preview Section */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <div className="sticky top-0">
              <ContractPreview
                data={previewData}
                accountSettings={accountSettings}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ContractsPage;
