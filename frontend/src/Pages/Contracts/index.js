import React, { useState, useEffect } from "react";
import { Card, Button, Form, Drawer, Space, message, Grid } from "antd";
import { FileTextOutlined, PlusCircleOutlined, EyeOutlined, DownloadOutlined, CloseOutlined } from "@ant-design/icons";
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

const ContractsPage = () => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
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
    // Update preview in real-time
    const values = form.getFieldsValue();
    if (values.customerName && values.scopeOfWork && values.totalPrice) {
      setPreviewData({
        ...values,
        date: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      });
    }
  };

  const handleOpenDrawer = () => {
    setDrawerVisible(true);
    setPreviewData(null);
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
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FileTextOutlined />
            Contracts
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage professional contracts
          </p>
        </div>
      </div>

      {/* Create New Card - Always visible */}
      <Card
        className="mb-6"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Create New Document
            </h2>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusCircleOutlined />}
            onClick={handleOpenDrawer}
            style={{
              background: "#fff",
              color: "#000",
              border: "none",
              fontWeight: "600",
              height: "48px",
              padding: "0 32px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            Create Contract
          </Button>
        </div>
      </Card>

      {/* Contracts List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Documents
        </h2>
        <ContractList
          contracts={contracts}
          onEdit={handleEditContract}
          onDownload={handleDownloadPDF}
        />
      </div>

      {/* Creation Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined style={{ fontSize: "20px", color: "#667eea" }} />
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
              style={{ background: "#667eea", borderColor: "#667eea" }}
            >
              {editingContract ? "Update Document" : "Save Document"}
            </Button>
          </div>
        }
        bodyStyle={{ padding: "24px" }}
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
