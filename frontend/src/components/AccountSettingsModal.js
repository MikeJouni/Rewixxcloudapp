import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as accountSettingsService from "../services/accountSettingsService";

const AccountSettingsModal = ({ open, onClose, currentSettings }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      form.setFieldsValue({
        companyName: currentSettings.companyName,
        email: currentSettings.email || "",
        phone: currentSettings.phone || "",
        address: currentSettings.address || "",
      });
    }
  }, [currentSettings, form]);

  const updateMutation = useMutation({
    mutationFn: accountSettingsService.updateAccountSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(["accountSettings"]);
      message.success("Account settings updated successfully!");
      onClose();
    },
    onError: (error) => {
      message.error("Failed to update account settings");
      console.error("Update error:", error);
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await updateMutation.mutateAsync(values);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Validation failed:", error);
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
          <Input size="large" placeholder="Enter email address" />
        </Form.Item>

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
      </Form>
    </Modal>
  );
};

export default AccountSettingsModal;
