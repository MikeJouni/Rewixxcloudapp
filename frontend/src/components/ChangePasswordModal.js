import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import Backend from "../Backend";
import { useAuth } from "../AuthContext";

const ChangePasswordModal = ({ open, onClose, isGoogleUser: propIsGoogleUser }) => {
  const { token } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // Fetch user info to determine if Google user (as fallback if prop not provided)
  const { data: userInfo, refetch: refetchUserInfo } = useQuery({
    queryKey: ["userInfo", token],
    queryFn: async () => {
      const response = await Backend.get("api/auth/user-info");
      return response;
    },
    enabled: !!token,
    staleTime: 0, // Always fetch fresh data when modal opens
    gcTime: 5 * 60 * 1000,
  });

  // Refetch user info when modal opens to ensure fresh data
  useEffect(() => {
    if (open && token) {
      refetchUserInfo();
    }
  }, [open, token, refetchUserInfo]);

  // Use prop if provided, otherwise use fetched userInfo
  const isGoogleUser = propIsGoogleUser !== undefined 
    ? propIsGoogleUser 
    : (userInfo?.hasGoogleAccount || false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        newPassword: values.newPassword,
      };

      // Only include oldPassword if user is not a Google OAuth user
      if (!isGoogleUser) {
        payload.oldPassword = values.oldPassword;
      }

      await Backend.post("api/auth/change-password", payload);
      message.success("Password changed successfully!");
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Password change error:", error);
      const errMsg =
        error.response?.data?.error || "Failed to change password. Please try again.";
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Change Password"
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
          Change Password
        </Button>,
      ]}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        {!isGoogleUser && (
          <Form.Item
            label="Current Password"
            name="oldPassword"
            rules={[{ required: true, message: "Please enter your current password" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Enter current password"
              size="large"
            />
          </Form.Item>
        )}

        <Form.Item
          label={isGoogleUser ? "Set Password" : "New Password"}
          name="newPassword"
          rules={[
            { required: true, message: isGoogleUser ? "Please enter a password" : "Please enter a new password" },
            {
              min: 6,
              message: "Password must be at least 6 characters",
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
            placeholder={isGoogleUser ? "Choose a password (min 6 characters)" : "Enter new password (min 6 characters)"}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Confirm New Password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm your new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Confirm new password"
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;

