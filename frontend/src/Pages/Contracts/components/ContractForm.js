import React, { useEffect } from "react";
import { Form, Input, Select, DatePicker, InputNumber, Divider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import * as customerService from "../../Customers/services/customerService";
import * as jobService from "../../Jobs/services/jobService";
import * as accountSettingsService from "../../../services/accountSettingsService";
import { useAuth } from "../../../AuthContext";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

const ContractForm = ({ form, onValuesChange, setSelectedCustomer, setSelectedJob }) => {
  const [selectedCustomerId, setSelectedCustomerId] = React.useState(null);

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

  useEffect(() => {
    if (accountSettings) {
      form.setFieldsValue({
        companyName: accountSettings.companyName,
        companyAddress: accountSettings.address,
        companyPhone: accountSettings.phone,
        companyEmail: accountSettings.email,
      });
    }
  }, [accountSettings, form]);

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
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      form.setFieldsValue({
        scopeOfWork: job.description || "",
        totalPrice: job.jobPrice || 0,
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
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
      initialValues={{
        documentType: "contract",
        status: "unpaid",
        date: dayjs(),
        warranty: "2 years on workmanship",
        depositPercent: 50,
        paymentMethods: "Zelle, Cash App, Check, Credit Card (3% fee), or Cash",
      }}
    >
      <Divider orientation="left" style={{ margin: "16px 0" }}>Company Information</Divider>

      <Form.Item label="Company Name" name="companyName">
        <Input size="large" disabled />
      </Form.Item>

      <Form.Item label="Address" name="companyAddress">
        <Input size="large" />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item label="Phone" name="companyPhone">
          <Input size="large" />
        </Form.Item>
        <Form.Item label="Email" name="companyEmail">
          <Input size="large" />
        </Form.Item>
      </div>

      <Form.Item label="License Number" name="licenseNumber">
        <Input size="large" placeholder="Master Lic# 6218750" />
      </Form.Item>

      <Form.Item label="ID Number" name="idNumber">
        <Input size="large" placeholder="802581271" />
      </Form.Item>

      <Divider orientation="left" style={{ margin: "16px 0" }}>Customer Information</Divider>

      <Form.Item label="Search Customer">
        <Select
          showSearch
          size="large"
          placeholder={customersLoading ? "Loading customers..." : "Search and select customer"}
          optionFilterProp="children"
          onChange={handleCustomerSelect}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          suffixIcon={<SearchOutlined />}
          allowClear
          loading={customersLoading}
          notFoundContent={customersLoading ? "Loading..." : customersError ? "Error loading customers" : "No customers found"}
        >
          {customers.map((customer) => {
            const address = [
              customer.addressLine1,
              customer.city,
              customer.state
            ].filter(Boolean).join(", ");
            return (
              <Option key={customer.id} value={customer.id}>
                {customer.name} - {address}
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      <Form.Item
        label="Customer Name"
        name="customerName"
        rules={[{ required: true, message: "Customer name is required" }]}
      >
        <Input size="large" placeholder="Enter customer name" />
      </Form.Item>

      <Form.Item
        label="Customer Address"
        name="customerAddress"
        rules={[{ required: true, message: "Customer address is required" }]}
      >
        <Input size="large" placeholder="Enter customer address" />
      </Form.Item>

      <Divider orientation="left" style={{ margin: "16px 0" }}>Job Details</Divider>

      <Form.Item label="Search Job">
        <Select
          showSearch
          size="large"
          placeholder={jobsLoading ? "Loading jobs..." : "Search and select job (optional)"}
          optionFilterProp="children"
          onChange={handleJobSelect}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          suffixIcon={<SearchOutlined />}
          allowClear
          loading={jobsLoading}
          notFoundContent={jobsLoading ? "Loading..." : jobsError ? "Error loading jobs" : "No jobs found"}
        >
          {jobs.map((job) => (
            <Option key={job.id} value={job.id}>
              {job.title} - {job.customer?.name || "No customer"}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Date" name="date">
        <DatePicker size="large" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item label="Status" name="status">
        <Select size="large">
          <Option value="unpaid">Unpaid</Option>
          <Option value="paid">Paid</Option>
          <Option value="partial">Partial Payment</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Scope of Work"
        name="scopeOfWork"
        rules={[{ required: true, message: "Scope of work is required" }]}
      >
        <TextArea
          rows={6}
          placeholder="- Installing and running new wires&#10;- Making the garage wall rough to final&#10;- etc."
        />
      </Form.Item>

      <Form.Item
        label="Total Price (Labor & Materials)"
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
        />
      </Form.Item>

      <Form.Item label="Warranty" name="warranty">
        <Input size="large" placeholder="2 years on workmanship" />
      </Form.Item>

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
    </Form>
  );
};

export default ContractForm;
