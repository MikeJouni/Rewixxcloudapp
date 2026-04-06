import React, { useEffect } from "react";
import { Form, Input, Select, DatePicker, InputNumber, Divider, Switch, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import * as customerService from "../../Customers/services/customerService";
import * as jobService from "../../Jobs/services/jobService";
import * as accountSettingsService from "../../../services/accountSettingsService";
import { useAuth } from "../../../AuthContext";
import { DEFAULT_TERMS_AND_CONDITIONS } from "../../../constants/termsTemplate";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

const ContractForm = ({ form, onValuesChange, setSelectedCustomer, setSelectedJob, isOpen, selectedCustomer: propSelectedCustomer, selectedJob: propSelectedJob, isMobile = false }) => {
  const [selectedCustomerId, setSelectedCustomerId] = React.useState(null);
  const selectedCustomer = propSelectedCustomer;
  const selectedJob = propSelectedJob;

  // Reset internal state when drawer closes/reopens
  useEffect(() => {
    if (isOpen) {
      // Reset selectedCustomerId when drawer opens to show all jobs
      setSelectedCustomerId(null);
    }
  }, [isOpen]);

  // Fetch customers
  const { data: customersData, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customerService.getCustomersList({ pageSize: 1000 }),
  });

  const customers = customersData?.customers || [];

  // Fetch jobs
  const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ["jobs", "all"],
    queryFn: () => jobService.getJobsList({ pageSize: 1000 }),
  });

  const allJobs = jobsData?.jobs || [];

  // Filter jobs by selected customer
  const jobs = selectedCustomerId
    ? allJobs.filter(job => job.customer?.id === selectedCustomerId)
    : allJobs;

  // Fetch account settings
  const { token } = useAuth();
  const { data: accountSettings } = useQuery({
    queryKey: ["accountSettings", token],
    queryFn: () => accountSettingsService.getAccountSettings(),
    enabled: !!token,
  });

  // Company info is always taken from account settings — no form fields needed

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setSelectedCustomerId(customerId);
      const fullAddress = [
        customer.addressLine1,
        customer.addressLine2,
        customer.city,
        customer.state,
        customer.zip
      ].filter(Boolean).join(", ");

      form.setFieldsValue({
        customerName: customer.name,
        customerAddress: fullAddress,
      });
    }
  };

  const handleJobSelect = (jobId) => {
    const job = allJobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);

      // Calculate total job cost — same logic as JobTable computeTotalCost
      const billingMaterialCost = (job.customMaterialCost !== undefined && job.customMaterialCost !== null)
        ? Number(job.customMaterialCost) : 0;
      const price = Number(job.jobPrice) || 0;
      const subtotal = billingMaterialCost + price;
      const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
      const totalJobCost = subtotal + taxAmount;

      // Calculate payment status from job payments
      const totalPaid = Array.isArray(job.payments) && job.payments.length > 0
        ? job.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
        : 0;
      const remainingBalance = totalJobCost - totalPaid;

      let contractStatus = "UNPAID";
      if (totalJobCost > 0) {
        if (totalPaid >= totalJobCost) {
          contractStatus = "PAID";
        } else if (totalPaid > 0) {
          contractStatus = "PARTIAL";
        }
      }

      form.setFieldsValue({
        scopeOfWork: job.description || "",
        totalPrice: totalJobCost,
        status: contractStatus,
      });

      if (job.customer) {
        setSelectedCustomer(job.customer);
        const fullAddress = [
          job.customer.addressLine1,
          job.customer.addressLine2,
          job.customer.city,
          job.customer.state,
          job.customer.zip
        ].filter(Boolean).join(", ");

        form.setFieldsValue({
          customerName: job.customer.name,
          customerAddress: fullAddress,
        });
      }

      // Trigger preview update (onValuesChange doesn't fire for programmatic setFieldsValue)
      setTimeout(() => onValuesChange && onValuesChange(), 0);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
      initialValues={{
        documentType: "contract",
        status: "UNPAID",
        date: dayjs(),
        warranty: "2 years on workmanship",
        depositPercent: 50,
        paymentMethods: "Zelle, Cash App, Check, Credit Card (3% fee), or Cash",
        showCostBreakdown: false,
        showMaterialsList: false,
        showMaterialsWithPricing: false,
      }}
    >
      <Divider orientation="left" style={{ margin: "16px 0" }}>Job & Customer</Divider>

      <Form.Item
        label="Select Job"
        name="jobId"
        rules={[{ required: true, message: "Please select a job" }]}
      >
        <Select
          showSearch
          size="large"
          placeholder={jobsLoading ? "Loading jobs..." : "Search and select a job"}
          optionFilterProp="children"
          onChange={handleJobSelect}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          suffixIcon={<SearchOutlined />}
          loading={jobsLoading}
          notFoundContent={jobsLoading ? "Loading..." : jobsError ? "Error loading jobs" : "No jobs found"}
        >
          {allJobs.map((job) => (
            <Option key={job.id} value={job.id}>
              {job.title} - {job.customer?.name || "No customer"}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Customer Name"
        name="customerName"
        hidden={!selectedJob}
      >
        <Input size="large" disabled />
      </Form.Item>

      <Form.Item
        label="Customer Address"
        name="customerAddress"
        hidden={!selectedJob}
      >
        <Input size="large" disabled />
      </Form.Item>

      <Divider orientation="left" style={{ margin: "16px 0" }}>Contract Details</Divider>

      <Form.Item
        label="Contract Number"
        name="contractNumber"
        extra="Leave blank to auto-generate"
      >
        <Input size="large" placeholder="CTR-2026-0001 (auto-generated if empty)" />
      </Form.Item>

      <Form.Item label="Date" name="date">
        <DatePicker size="large" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Scope of Work"
        name="scopeOfWork"
        rules={[{ required: true, message: "Scope of work is required" }]}
      >
        <TextArea
          rows={isMobile ? 4 : 6}
          placeholder="- Installing and running new wires&#10;- Making the garage wall rough to final&#10;- etc."
        />
      </Form.Item>

      <Form.Item
        label={selectedJob ? "Status (from Job)" : "Status"}
        name="status"
      >
        <Select size="large" disabled={!!selectedJob}>
          <Option value="UNPAID">Unpaid</Option>
          <Option value="PAID">Paid</Option>
          <Option value="PARTIAL">Partial Payment</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label={selectedJob ? "Total Price (from Job)" : "Total Price"}
        name="totalPrice"
        rules={[{ required: true, message: "Total price is required" }]}
      >
        <InputNumber
          size="large"
          style={{ width: "100%" }}
          prefix="$"
          min={0}
          step={0.01}
          precision={2}
          disabled={!!selectedJob}
        />
      </Form.Item>

      <Divider orientation="left" style={{ margin: "16px 0" }}>Display Options</Divider>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <Form.Item
          label="Show Cost Breakdown"
          name="showCostBreakdown"
          valuePropName="checked"
          extra="Show 'Labor & Materials' line instead of just total"
        >
          <Switch />
        </Form.Item>

        {selectedJob && (
          <Form.Item
            label="Show Materials List"
            name="showMaterialsList"
            valuePropName="checked"
            extra="Display materials from linked job"
          >
            <Switch />
          </Form.Item>
        )}
        {selectedJob && (
          <Form.Item
            label="Show Materials with Pricing"
            name="showMaterialsWithPricing"
            valuePropName="checked"
            extra="Show individual pricing and quantity for each material"
          >
            <Switch />
          </Form.Item>
        )}
      </div>

      <Form.Item label="Warranty" name="warranty">
        <Input size="large" placeholder="2 years on workmanship" />
      </Form.Item>

      <Form.Item
        label={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span>Terms and Conditions</span>
          </div>
        }
        name="termsAndConditions"
      >
        <TextArea
          rows={isMobile ? 4 : 8}
          placeholder="Enter terms and conditions..."
        />
      </Form.Item>
      <Button
        size="small"
        type="dashed"
        style={{ marginTop: -12, marginBottom: 16 }}
        onClick={() => {
          form.setFieldsValue({ termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS });
          setTimeout(() => onValuesChange && onValuesChange(), 0);
        }}
      >
        Use Template
      </Button>

      <Divider orientation="left" style={{ margin: "16px 0" }}>Payment Terms</Divider>

      <Form.Item label="Deposit Percentage" name="depositPercent">
        <InputNumber
          size="large"
          style={{ width: "100%" }}
          min={0}
          max={100}
          formatter={(value) => `${value}%`}
          parser={(value) => value.replace("%", "")}
        />
      </Form.Item>

      <Form.Item label="Payment Methods" name="paymentMethods">
        <TextArea
          rows={2}
          placeholder="Zelle, Cash App, Check, Credit Card (3% fee), or Cash"
        />
      </Form.Item>

      <Divider orientation="left" style={{ margin: "16px 0" }}>Client Signature</Divider>

      <Form.Item label="Client Printed Name" name="clientPrintedName">
        <Input size="large" placeholder="Enter client's full name" />
      </Form.Item>

      <Form.Item label="Client Signature Date" name="clientSignatureDate">
        <DatePicker size="large" style={{ width: "100%" }} />
      </Form.Item>

      <Divider orientation="left" style={{ margin: "16px 0" }}>Contractor Signature</Divider>

      <Form.Item
        label="Auto-sign as Contractor"
        name="autoSignContractor"
        valuePropName="checked"
        extra="Automatically sign with your company name"
      >
        <Switch />
      </Form.Item>
    </Form>
  );
};

export default ContractForm;
