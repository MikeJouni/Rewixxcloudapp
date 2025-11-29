import React, { useState } from "react";
import { Button, Table, Popconfirm, Tag, message, Select, Input, InputNumber } from "antd";
import { PlusOutlined, DeleteOutlined, DollarOutlined, CloseOutlined, MinusCircleOutlined } from "@ant-design/icons";
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
  });

  // Ensure payments is always an array
  const payments = Array.isArray(paymentsData) ? paymentsData : [];

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
            icon={<MinusCircleOutlined />}
            size="small"
            loading={deletePaymentMutation.isLoading}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="mb-4 mt-2">
      <div className="flex justify-between items-center mb-3 pt-2">
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-lg" />
          <h3 className="text-base sm:text-lg font-semibold m-0">
            Payments
          </h3>
          {isFullyPaid && totalCost > 0 && (
            <Tag color="success">
              Fully Paid ✓
            </Tag>
          )}
        </div>
        {!showAddPaymentForm && !isFullyPaid && totalCost > 0 && (
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
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-600">
              {((totalPaid / totalCost) * 100).toFixed(1)}% Paid
            </p>
            <p className="text-xs text-gray-600 font-medium">
              Remaining: ${remainingBalance.toFixed(2)}
            </p>
          </div>
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

      {/* Desktop Table View */}
      <div className="hidden md:block">
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-6 text-gray-500">Loading...</div>
        ) : payments && payments.length > 0 ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
            >
              {/* Header with Type and Amount */}
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                <div>
                  <Tag color={payment.paymentType === "CASH" ? "green" : "blue"} className="mb-2">
                    {payment.paymentType === "CASH" ? "Cash" : "Check"}
                  </Tag>
                  <div className="text-xs text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${parseFloat(payment.amount).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Check Number (if applicable) */}
              {payment.checkNumber && (
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-1">Check Number</div>
                  <div className="text-sm font-medium text-gray-900">{payment.checkNumber}</div>
                </div>
              )}

              {/* Delete Button */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Popconfirm
                  title="Delete Payment"
                  description="Are you sure you want to delete this payment?"
                  onConfirm={() => deletePaymentMutation.mutate(payment.id)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <button
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    disabled={deletePaymentMutation.isLoading}
                  >
                    <DeleteOutlined />
                    Delete Payment
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
            No payments recorded yet
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsSection;
