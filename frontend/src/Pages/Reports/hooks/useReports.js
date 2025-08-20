import { useState, useMemo } from "react";

export const useReports = (jobs, customers) => {
  const [selectedReportType, setSelectedReportType] = useState("customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const generateCustomerReport = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;

    const customerJobs = jobs.filter(job => job.customer?.id === customerId);
    
    const totalJobs = customerJobs.length;
    const completedJobs = customerJobs.filter(job => job.status === "COMPLETED").length;
    const inProgressJobs = customerJobs.filter(job => job.status === "IN_PROGRESS").length;
    const pendingJobs = customerJobs.filter(job => job.status === "PENDING").length;
    
    // Calculate total cost and hours
    let totalCost = 0;
    let totalEstimatedHours = 0;
    let totalActualHours = 0;
    
    customerJobs.forEach(job => {
      // Calculate job cost from materials
      if (job.sales && Array.isArray(job.sales)) {
        job.sales.forEach(sale => {
          if (sale.saleItems && Array.isArray(sale.saleItems)) {
            sale.saleItems.forEach(item => {
              totalCost += (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
            });
          }
        });
      }
      
      totalEstimatedHours += Number(job.estimatedHours) || 0;
      totalActualHours += Number(job.actualHours) || 0;
    });

    return {
      type: "Customer Report",
      customer: {
        name: customer.name,
        email: customer.username,
        phone: customer.phone,
        address: `${customer.addressLine1 || ""} ${customer.addressLine2 || ""} ${customer.city || ""} ${customer.state || ""} ${customer.zip || ""}`.trim()
      },
      summary: {
        totalJobs,
        completedJobs,
        inProgressJobs,
        pendingJobs,
        totalEstimatedHours,
        totalActualHours,
        totalCost: totalCost.toFixed(2)
      },
      jobs: customerJobs.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status,
        priority: job.priority,
        startDate: job.startDate,
        endDate: job.endDate,
        estimatedHours: job.estimatedHours || 0,
        actualHours: job.actualHours || 0,
        description: job.description,
        totalCost: (() => {
          let jobCost = 0;
          if (job.sales && Array.isArray(job.sales)) {
            job.sales.forEach(sale => {
              if (sale.saleItems && Array.isArray(sale.saleItems)) {
                sale.saleItems.forEach(item => {
                  jobCost += (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
                });
              }
            });
          }
          return jobCost.toFixed(2);
        })()
      }))
    };
  };

  // Generate job report
  const generateJobReport = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

    // Calculate job cost and materials
    let totalCost = 0;
    const materials = [];
    
    if (job.sales && Array.isArray(job.sales)) {
      job.sales.forEach(sale => {
        if (sale.saleItems && Array.isArray(sale.saleItems)) {
          sale.saleItems.forEach(item => {
            const itemCost = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
            totalCost += itemCost;
            
            materials.push({
              name: item.product?.name || "Unknown Product",
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || 0,
              total: itemCost.toFixed(2),
              notes: item.notes || ""
            });
          });
        }
      });
    }

    // Calculate efficiency
    const estimatedHours = Number(job.estimatedHours) || 0;
    const actualHours = Number(job.actualHours) || 0;
    const efficiency = estimatedHours > 0 ? ((estimatedHours - actualHours) / estimatedHours * 100).toFixed(1) : 0;
    
    // Calculate duration
    let duration = 0;
    if (job.startDate && job.endDate) {
      const start = new Date(job.startDate);
      const end = new Date(job.endDate);
      duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }

    return {
      type: "Job Report",
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        status: job.status,
        priority: job.priority,
        startDate: job.startDate,
        endDate: job.endDate,
        customerName: job.customer?.name || "No Customer"
      },
      summary: {
        estimatedHours,
        actualHours,
        efficiency: efficiency + "%",
        duration: duration + " days",
        totalCost: totalCost.toFixed(2),
        totalMaterials: materials.length
      },
      materials,
      receipts: job.receiptImageUrls ? job.receiptImageUrls.length : 0
    };
  };

  // Get current report based on selection
  const currentReport = useMemo(() => {
    if (selectedReportType === "customer" && selectedCustomerId) {
      return generateCustomerReport(selectedCustomerId);
    } else if (selectedReportType === "job" && selectedJobId) {
      return generateJobReport(selectedJobId);
    }
    return null;
  }, [selectedReportType, selectedCustomerId, selectedJobId, jobs, customers]);

  // Export report as CSV
  const exportReport = (report) => {
    if (!report) return;

    let csvContent = "";
    
    if (report.type === "Customer Report") {
      // Customer report CSV
      csvContent += "Customer Report\n";
      csvContent += `Customer: ${report.customer.name}\n`;
      csvContent += `Email: ${report.customer.email}\n`;
      csvContent += `Phone: ${report.customer.phone}\n`;
      csvContent += `Address: ${report.customer.address}\n\n`;
      
      csvContent += "Summary\n";
      csvContent += `Total Jobs,${report.summary.totalJobs}\n`;
      csvContent += `Completed,${report.summary.completedJobs}\n`;
      csvContent += `In Progress,${report.summary.inProgressJobs}\n`;
      csvContent += `Pending,${report.summary.pendingJobs}\n`;
      csvContent += `Total Hours (Est),${report.summary.totalEstimatedHours}\n`;
      csvContent += `Total Hours (Act),${report.summary.totalActualHours}\n`;
      csvContent += `Total Cost,$${report.summary.totalCost}\n\n`;
      
      csvContent += "Jobs\n";
      csvContent += "ID,Title,Status,Priority,Start Date,End Date,Est Hours,Act Hours,Cost\n";
      report.jobs.forEach(job => {
        csvContent += `${job.id},"${job.title}",${job.status},${job.priority},${job.startDate || ""},${job.endDate || ""},${job.estimatedHours},${job.actualHours},$${job.totalCost}\n`;
      });
    } else if (report.type === "Job Report") {
      // Job report CSV
      csvContent += "Job Report\n";
      csvContent += `Title: ${report.job.title}\n`;
      csvContent += `Customer: ${report.job.customerName}\n`;
      csvContent += `Status: ${report.job.status}\n`;
      csvContent += `Priority: ${report.job.priority}\n`;
      csvContent += `Start Date: ${report.job.startDate || ""}\n`;
      csvContent += `End Date: ${report.job.endDate || ""}\n\n`;
      
      csvContent += "Summary\n";
      csvContent += `Estimated Hours,${report.summary.estimatedHours}\n`;
      csvContent += `Actual Hours,${report.summary.actualHours}\n`;
      csvContent += `Efficiency,${report.summary.efficiency}\n`;
      csvContent += `Duration,${report.summary.duration}\n`;
      csvContent += `Total Cost,$${report.summary.totalCost}\n`;
      csvContent += `Total Materials,${report.summary.totalMaterials}\n\n`;
      
      csvContent += "Materials\n";
      csvContent += "Name,Quantity,Unit Price,Total,Notes\n";
      report.materials.forEach(material => {
        csvContent += `"${material.name}",${material.quantity},$${material.unitPrice},$${material.total},"${material.notes}"\n`;
      });
    }

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${report.type.replace(' ', '_')}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    selectedReportType,
    setSelectedReportType,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedJobId,
    setSelectedJobId,
    currentReport,
    exportReport,
    generateCustomerReport,
    generateJobReport
  };
};
