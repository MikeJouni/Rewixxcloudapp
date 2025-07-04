import { useState, useEffect } from "react";

const useReports = () => {
  const [reportType, setReportType] = useState("customer");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Mock data
  useEffect(() => {
    setCustomers([
      {
        id: 1,
        name: "John Smith",
        email: "john@example.com",
        phone: "555-0101",
      },
      { id: 2, name: "Jane Doe", email: "jane@example.com", phone: "555-0102" },
      {
        id: 3,
        name: "Bob Johnson",
        email: "bob@example.com",
        phone: "555-0103",
      },
    ]);

    setJobs([
      {
        id: 1,
        customerName: "John Smith",
        title: "Kitchen Remodel",
        status: "Completed",
        estimatedHours: 40,
        actualHours: 42,
        startDate: "2024-01-15",
        endDate: "2024-02-15",
      },
      {
        id: 2,
        customerName: "Jane Doe",
        title: "Bathroom Update",
        status: "In Progress",
        estimatedHours: 20,
        actualHours: 15,
        startDate: "2024-02-01",
        endDate: "2024-02-20",
      },
      {
        id: 3,
        customerName: "Bob Johnson",
        title: "Electrical Panel Upgrade",
        status: "Pending",
        estimatedHours: 8,
        actualHours: 0,
        startDate: "2024-03-01",
        endDate: "2024-03-02",
      },
    ]);
  }, []);

  const generateReport = () => {
    let report = null;

    if (reportType === "customer" && selectedCustomer) {
      const customer = customers.find(
        (c) => c.id === parseInt(selectedCustomer)
      );
      const customerJobs = jobs.filter(
        (job) => job.customerName === customer.name
      );

      report = {
        type: "Customer Report",
        customer: customer,
        jobs: customerJobs,
        summary: {
          totalJobs: customerJobs.length,
          completedJobs: customerJobs.filter(
            (job) => job.status === "Completed"
          ).length,
          inProgressJobs: customerJobs.filter(
            (job) => job.status === "In Progress"
          ).length,
          pendingJobs: customerJobs.filter((job) => job.status === "Pending")
            .length,
          totalEstimatedHours: customerJobs.reduce(
            (sum, job) => sum + job.estimatedHours,
            0
          ),
          totalActualHours: customerJobs.reduce(
            (sum, job) => sum + job.actualHours,
            0
          ),
        },
      };
    } else if (reportType === "job" && selectedJob) {
      const job = jobs.find((j) => j.id === parseInt(selectedJob));

      report = {
        type: "Job Report",
        job: job,
        summary: {
          status: job.status,
          estimatedHours: job.estimatedHours,
          actualHours: job.actualHours,
          efficiency:
            job.actualHours > 0
              ? ((job.estimatedHours / job.actualHours) * 100).toFixed(1)
              : "N/A",
          duration:
            job.startDate && job.endDate
              ? Math.ceil(
                  (new Date(job.endDate) - new Date(job.startDate)) /
                    (1000 * 60 * 60 * 24)
                )
              : "N/A",
        },
      };
    }

    setGeneratedReport(report);
    setShowReport(true);
  };

  const exportReport = () => {
    if (!generatedReport) return;

    let content = "";
    if (generatedReport.type === "Customer Report") {
      content = `Customer Report: ${generatedReport.customer.name}
Generated: ${new Date().toLocaleDateString()}

Customer Information:
- Name: ${generatedReport.customer.name}
- Email: ${generatedReport.customer.email}
- Phone: ${generatedReport.customer.phone}

Summary:
- Total Jobs: ${generatedReport.summary.totalJobs}
- Completed: ${generatedReport.summary.completedJobs}
- In Progress: ${generatedReport.summary.inProgressJobs}
- Pending: ${generatedReport.summary.pendingJobs}
- Total Estimated Hours: ${generatedReport.summary.totalEstimatedHours}
- Total Actual Hours: ${generatedReport.summary.totalActualHours}

Jobs:
${generatedReport.jobs
  .map(
    (job) =>
      `- ${job.title} (${job.status}) - Est: ${job.estimatedHours}h, Act: ${job.actualHours}h`
  )
  .join("\n")}`;
    } else {
      content = `Job Report: ${generatedReport.job.title}
Generated: ${new Date().toLocaleDateString()}

Job Information:
- Title: ${generatedReport.job.title}
- Customer: ${generatedReport.job.customerName}
- Status: ${generatedReport.job.status}
- Start Date: ${generatedReport.job.startDate}
- End Date: ${generatedReport.job.endDate}

Summary:
- Estimated Hours: ${generatedReport.summary.estimatedHours}
- Actual Hours: ${generatedReport.summary.actualHours}
- Efficiency: ${generatedReport.summary.efficiency}%
- Duration: ${generatedReport.summary.duration} days`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generatedReport.type.replace(" ", "_")}_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    reportType,
    setReportType,
    selectedCustomer,
    setSelectedCustomer,
    selectedJob,
    setSelectedJob,
    customers,
    jobs,
    generatedReport,
    showReport,
    generateReport,
    exportReport,
  };
};

export default useReports;
