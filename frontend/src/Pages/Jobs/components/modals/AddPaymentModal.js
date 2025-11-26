import React, { useState } from "react";
import { Modal, Form, InputNumber, Select, Input, message } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as paymentService from "../../services/paymentService";

const { Option } = Select;

const AddPaymentModal = ({ open, onClose, jobId }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [paymentType, setPaymentType] = useState("CASH");

  const createPaymentMutation = useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(["payments", jobId]);
      queryClient.invalidateQueries(["jobs"]);
      message.success("Payment added successfully!");
      form.resetFields();
      setPaymentType("CASH");
      onClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || "Failed to add payment";
      message.error(errorMessage);
    },
  });

  const handleSubmit = async (values) => {
    const paymentData = {
      jobId: jobId,
      paymentType: values.paymentType,
      amount: values.amount,
      checkNumber: values.paymentType === "CHECK" ? values.checkNumber : null,
    };

    createPaymentMutation.mutate(paymentData);
  };

  const handleCancel = () => {
    form.resetFields();
    setPaymentType("CASH");
    onClose();
  };

  return (
    <Modal
      title="Add Payment"
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={createPaymentMutation.isLoading}
      okText="Add Payment"
      cancelText="Cancel"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          paymentType: "CASH",
        }}
      >
        <Form.Item
          label="Payment Type"
          name="paymentType"
          rules={[{ required: true, message: "Please select a payment type" }]}
        >
          <Select
            size="large"
            onChange={(value) => setPaymentType(value)}
            placeholder="Select payment type"
          >
            <Option value="CASH">Cash</Option>
            <Option value="CHECK">Check</Option>
          </Select>
        </Form.Item>

        {paymentType === "CHECK" && (
          <Form.Item
            label="Check Number"
            name="checkNumber"
            rules={[
              {
                required: true,
                message: "Please enter check number",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Enter check number"
              maxLength={50}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Payment Amount"
          name="amount"
          rules={[
            { required: true, message: "Please enter payment amount" },
            {
              type: "number",
              min: 0.01,
              message: "Amount must be greater than zero",
            },
          ]}
        >
          <InputNumber
            size="large"
            style={{ width: "100%" }}
            placeholder="Enter amount"
            precision={2}
            min={0.01}
            prefix="$"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddPaymentModal;
