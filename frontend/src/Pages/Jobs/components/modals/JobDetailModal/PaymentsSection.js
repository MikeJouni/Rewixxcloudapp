import React, { useState } from "react";
import { Button, Table, Popconfirm, Tag, message, Select, Input, InputNumber } from "antd";
import { PlusOutlined, DeleteOutlined, DollarOutlined, CloseOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as paymentService from "../../../services/paymentService";

const { Option } = Select;

const PaymentsSection = ({ job, totalCost }) => {
  const queryClient = useQueryClient();
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState("CASH");
  const [checkNumber, setCheckNumber] = useState("");
  const [amount, setAmount] = useState(null);
  const [downPaymentPercentage, setDownPaymentPercentage] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch payments for this job
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments", job.id],
    queryFn: () => paymentService.getPaymentsByJobId(job.id),
    select: (response) => response.data,
  });

  const payments = paymentsData || [];

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(["payments", job.id]);
      queryClient.invalidateQueries(["jobs"]);
      message.success("Payment added successfully!");
      resetForm();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || "Failed to add payment";
      message.error(errorMessage);
    },
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: paymentService.deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries(["payments", job.id]);
      queryClient.invalidateQueries(["jobs"]);
      message.success("Payment deleted successfully!");
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || "Failed to delete payment";
      message.error(errorMessage);
    },
  });

  // Calculate total paid and remaining balance
  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  const remainingBalance = totalCost - totalPaid;
  const isFullyPaid = remainingBalance <= 0;

  const resetForm = () => {
    setShowAddPaymentForm(false);
    setPaymentType("CASH");
    setCheckNumber("");
    setAmount(null);
    setDownPaymentPercentage(null);
    setErrors({});
  };

  const handleDownPaymentChange = (percentage) => {
    setDownPaymentPercentage(percentage);
    if (percentage && totalCost > 0) {
      const calculatedAmount = (totalCost * percentage) / 100;
      setAmount(Math.min(calculatedAmount, remainingBalance));
    } else {
      setAmount(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!amount || amount <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }

    if (amount > remainingBalance) {
      newErrors.amount = `Amount cannot exceed remaining balance ($${remainingBalance.toFixed(2)})`;
    }

    if (paymentType === "CHECK" && (!checkNumber || checkNumber.trim() === "")) {
      newErrors.checkNumber = "Check number is required for check payments";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPayment = () => {
    if (!validateForm()) {
      return;
    }

    const paymentData = {
      jobId: job.id,
      paymentType: paymentType,
      amount: amount,
      checkNumber: paymentType === "CHECK" ? checkNumber : null,
    };

    createPaymentMutation.mutate(paymentData);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (date) => new Date(date).toLocaleDateString(),
      width: 120,
    },
    {
      title: "Type",
      dataIndex: "paymentType",
      key: "paymentType",
      width: 100,
      render: (type) => (
        <Tag color={type === "CASH" ? "green" : "blue"}>
          {type === "CASH" ? "Cash" : "Check"}
        </Tag>
      ),
    },
    {
      title: "Check #",
      dataIndex: "checkNumber",
      key: "checkNumber",
      width: 120,
      render: (checkNumber) => checkNumber || "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, payment) => (
        <Popconfirm
          title="Delete Payment"
          description="Are you sure you want to delete this payment?"
          onConfirm={() => deletePaymentMutation.mutate(payment.id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            loading={deletePaymentMutation.isLoading}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <DollarOutlined className="text-lg" />
          <h3 className="text-base sm:text-lg font-semibold m-0">
            Payments
          </h3>
          <Tag color={isFullyPaid ? "success" : "processing"} style={{ marginLeft: '8px' }}>
            ${totalPaid.toFixed(2)} / ${totalCost.toFixed(2)}
          </Tag>
          {!isFullyPaid && (
            <Tag color="warning">
              Remaining: ${remainingBalance.toFixed(2)}
            </Tag>
          )}
          {isFullyPaid && (
            <Tag color="success">
              Fully Paid ✓
            </Tag>
          )}
        </div>
        {!showAddPaymentForm && !isFullyPaid && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddPaymentForm(true)}
            size="middle"
            style={{ background: '#1f2937' }}
          >
            Add Payment
          </Button>
        )}
      </div>

      {/* Payment Progress Bar */}
      {totalCost > 0 && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((totalPaid / totalCost) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {((totalPaid / totalCost) * 100).toFixed(1)}% Paid
          </p>
        </div>
      )}

      {/* Inline Add Payment Form */}
      {showAddPaymentForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold m-0">Add New Payment</h4>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={resetForm}
              size="small"
            />
          </div>

          {/* Down Payment Quick Select */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Quick Down Payment
            </label>
            <div className="flex gap-2 flex-wrap">
              {[10, 20, 25, 50, 100].map((percent) => (
                <Button
                  key={percent}
                  size="small"
                  onClick={() => handleDownPaymentChange(percent)}
                  type={downPaymentPercentage === percent ? "primary" : "default"}
                >
                  {percent}%
                </Button>
              ))}
              <Button
                size="small"
                onClick={() => {
                  setAmount(remainingBalance);
                  setDownPaymentPercentage(null);
                }}
                type="default"
              >
                Full Balance
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Payment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Type *
              </label>
              <Select
                value={paymentType}
                onChange={(value) => {
                  setPaymentType(value);
                  if (errors.checkNumber) {
                    setErrors(prev => ({ ...prev, checkNumber: null }));
                  }
                }}
                style={{ width: '100%' }}
                size="large"
              >
                <Option value="CASH">Cash</Option>
                <Option value="CHECK">Check</Option>
              </Select>
            </div>

            {/* Check Number (conditional) */}
            {paymentType === "CHECK" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Check Number *
                </label>
                <Input
                  value={checkNumber}
                  onChange={(e) => {
                    setCheckNumber(e.target.value);
                    if (errors.checkNumber) {
                      setErrors(prev => ({ ...prev, checkNumber: null }));
                    }
                  }}
                  placeholder="Enter check number"
                  size="large"
                  status={errors.checkNumber ? "error" : ""}
                />
                {errors.checkNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.checkNumber}</p>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <InputNumber
                value={amount}
                onChange={(value) => {
                  setAmount(value);
                  if (errors.amount) {
                    setErrors(prev => ({ ...prev, amount: null }));
                  }
                }}
                placeholder="0.00"
                size="large"
                style={{ width: '100%' }}
                precision={2}
                min={0.01}
                prefix="$"
                status={errors.amount ? "error" : ""}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              type="primary"
              onClick={handleAddPayment}
              loading={createPaymentMutation.isLoading}
              style={{ background: '#059669' }}
            >
              Add Payment
            </Button>
            <Button onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Table
        dataSource={payments}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="small"
        locale={{
          emptyText: "No payments recorded yet",
        }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default PaymentsSection;
