import React, { useState } from "react";
import { Card, Button, Form, Drawer, Space, message, Grid } from "antd";
import { FileTextOutlined, PlusCircleOutlined, EyeOutlined, DownloadOutlined, CloseOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import * as accountSettingsService from "../../services/accountSettingsService";
import { useAuth } from "../../AuthContext";
import ContractForm from "./components/ContractForm";
import ContractPreview from "./components/ContractPreview";
import ContractList from "./components/ContractList";
import dayjs from "dayjs";

const { useBreakpoint } = Grid;

const ContractsPage = () => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [contracts] = useState([]); // TODO: Fetch from backend
  const screens = useBreakpoint();

  // Fetch account settings
  const { token } = useAuth();
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token,
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
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      // TODO: Save to backend
      message.success("Contract saved successfully!");
      handleCloseDrawer();
    } catch (error) {
      message.error("Please fill in all required fields");
    }
  };

  const handleDownload = () => {
    message.info("PDF download functionality will be implemented");
    // TODO: Implement PDF generation
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
        <ContractList contracts={contracts} />
      </div>

      {/* Creation Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined style={{ fontSize: "20px", color: "#667eea" }} />
            <span style={{ fontSize: "18px", fontWeight: "600" }}>
              Create Contract
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
              style={{ background: "#667eea", borderColor: "#667eea" }}
            >
              Save Document
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
