import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Upload } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as accountSettingsService from "../services/accountSettingsService";
import config from "../config";

const AccountSettingsModal = ({ open, onClose, currentSettings }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open && currentSettings) {
      form.setFieldsValue({
        companyName: currentSettings.companyName,
        email: currentSettings.email || "",
        phone: currentSettings.phone || "",
        address: currentSettings.address || "",
      });
      setLogoUrl(currentSettings.logoUrl || null);
    }
  }, [open, currentSettings, form]);

  const updateMutation = useMutation({
    mutationFn: accountSettingsService.updateAccountSettings,
    onSuccess: () => {
      // Invalidate all accountSettings queries (they're keyed by token)
      queryClient.invalidateQueries({ queryKey: ["accountSettings"] });
      message.success("Account settings updated successfully!");
      onClose();
    },
    onError: (error) => {
      message.error("Failed to update account settings");
      console.error("Update error:", error);
    },
  });

  const handleLogoUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${config.SPRING_API_BASE}/api/logo/upload`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setLogoUrl(data.url);
      message.success("Logo uploaded successfully!");
    } catch (error) {
      message.error(error.message || "Failed to upload logo");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handleLogoRemove = () => {
    setLogoUrl(null);
    message.success("Logo removed");
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await updateMutation.mutateAsync({
        ...values,
        logoUrl: logoUrl,
      });
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Account Settings"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          style={{ background: '#1f2937' }}
        >
          Save Changes
        </Button>,
      ]}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          label="Company Name"
          name="companyName"
          rules={[{ required: true, message: "Company name is required" }]}
        >
          <Input size="large" placeholder="Enter company name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ type: "email", message: "Please enter a valid email" }]}
        >
          <Input 
            size="large" 
            placeholder="Enter email address" 
            disabled 
            style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
          />
        </Form.Item>
        <div style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "-16px", marginBottom: "16px" }}>
          Email is automatically synced with your account and cannot be changed here
        </div>

        <Form.Item label="Phone" name="phone">
          <Input size="large" placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item label="Address" name="address">
          <Input.TextArea
            size="large"
            rows={3}
            placeholder="Enter business address"
          />
        </Form.Item>

        <Form.Item label="Company Logo">
          <div style={{ marginTop: 8 }}>
            {logoUrl ? (
              <div style={{
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                padding: "16px",
                background: "#fafafa"
              }}>
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={`${config.SPRING_API_BASE}${logoUrl}`}
                    alt="Company Logo"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "100px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={handleLogoRemove}
                  danger
                  size="small"
                >
                  Remove Logo
                </Button>
              </div>
            ) : (
              <Upload
                beforeUpload={handleLogoUpload}
                accept="image/*"
                showUploadList={false}
                disabled={uploading}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={uploading}
                  size="large"
                >
                  {uploading ? "Uploading..." : "Upload Logo"}
                </Button>
              </Upload>
            )}
            <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c" }}>
              Recommended: PNG or JPG, max 5MB. Will be used on invoices and contracts.
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AccountSettingsModal;
