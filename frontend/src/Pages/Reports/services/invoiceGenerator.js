import { jsPDF } from "jspdf";

// Helper function to load image as base64
const loadImageAsBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
};

export const generateInvoicePDF = async (job, accountSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Professional color palette
  const colors = {
    primary: [51, 51, 51],      // Dark gray for headers
    secondary: [102, 102, 102], // Medium gray for labels
    text: [33, 33, 33],         // Near black for body text
    light: [150, 150, 150],     // Light gray for subtle text
    line: [200, 200, 200],      // Light gray for lines
    success: [34, 139, 34],     // Forest green for positive
    error: [178, 34, 34],       // Firebrick red for negative
    tableHeader: [245, 245, 245], // Light gray background
  };

  // Helper function to add text
  const addText = (text, x, y, options = {}) => {
    doc.setFontSize(options.fontSize || 12);
    doc.setFont("helvetica", options.fontStyle || "normal");
    doc.text(text || "", x, y, options);
    return y + (options.lineHeight || 7);
  };

  // Helper function to draw a line
  const drawLine = (y) => {
    doc.setDrawColor(...colors.line);
    doc.line(margin, y, pageWidth - margin, y);
    return y + 5;
  };

  // Try to load and add company logo
  if (accountSettings?.logoUrl) {
    try {
      // Construct full URL for the logo
      const baseUrl = window.location.origin.includes('localhost')
        ? 'http://localhost:8080'
        : window.location.origin;
      const logoUrl = accountSettings.logoUrl.startsWith('http')
        ? accountSettings.logoUrl
        : `${baseUrl}${accountSettings.logoUrl}`;

      const logoBase64 = await loadImageAsBase64(logoUrl);
      // Add logo centered at top (40x40 px = ~15x15 mm)
      const logoSize = 15;
      doc.addImage(logoBase64, "PNG", (pageWidth - logoSize) / 2, yPos, logoSize, logoSize);
      yPos += logoSize + 5;
    } catch (error) {
      console.warn("Could not load logo for PDF:", error);
    }
  }

  // Header - Company Name
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text(accountSettings?.companyName || "Company Name", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  // Company Contact Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);

  if (accountSettings?.address) {
    doc.text(accountSettings.address, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (accountSettings?.phone || accountSettings?.email) {
    doc.text(
      `${accountSettings?.phone || ""}${accountSettings?.phone && accountSettings?.email ? " | " : ""}${accountSettings?.email || ""}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    );
    yPos += 5;
  }

  yPos += 5;
  yPos = drawLine(yPos);
  yPos += 8;

  // Invoice Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("INVOICE", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Invoice Details (left side) and Customer Info (right side)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);

  // Left column - Invoice details
  doc.text("Invoice Date:", margin, yPos);
  doc.setTextColor(...colors.text);
  doc.text(new Date().toLocaleDateString(), margin + 30, yPos);

  // Right column - Bill To
  doc.setTextColor(...colors.secondary);
  doc.text("Bill To:", pageWidth / 2 + 10, yPos);
  yPos += 7;

  doc.text("Invoice #:", margin, yPos);
  doc.setTextColor(...colors.text);
  doc.text(`INV-${job.id || "000"}`, margin + 30, yPos);

  doc.setFont("helvetica", "bold");
  doc.text(job.customer?.name || "Customer", pageWidth / 2 + 10, yPos);
  yPos += 7;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  doc.text("Job #:", margin, yPos);
  doc.setTextColor(...colors.text);
  doc.text(`JOB-${job.id || "000"}`, margin + 30, yPos);

  if (job.customer?.phone) {
    doc.setTextColor(...colors.secondary);
    doc.text(job.customer.phone, pageWidth / 2 + 10, yPos);
  }
  yPos += 7;

  if (job.customer?.addressLine1) {
    doc.setTextColor(...colors.secondary);
    doc.text(job.customer.addressLine1, pageWidth / 2 + 10, yPos);
    yPos += 5;
  }

  yPos += 10;
  yPos = drawLine(yPos);
  yPos += 10;

  // Job Details Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  yPos = addText("Job Details", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 3;

  doc.setTextColor(...colors.text);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  yPos = addText(`${job.title || "N/A"}`, margin, yPos);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (job.workSiteAddress) {
    doc.setTextColor(...colors.secondary);
    yPos = addText(`Work Site: ${job.workSiteAddress}`, margin, yPos);
  }

  if (job.startDate) {
    doc.setTextColor(...colors.secondary);
    yPos = addText(`Start Date: ${new Date(job.startDate).toLocaleDateString()}`, margin, yPos);
  }

  if (job.endDate) {
    doc.setTextColor(...colors.secondary);
    yPos = addText(`End Date: ${new Date(job.endDate).toLocaleDateString()}`, margin, yPos);
  }

  if (job.description) {
    yPos += 3;
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    const descLines = doc.splitTextToSize(job.description, pageWidth - (margin * 2));
    descLines.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
  }

  yPos += 10;

  // Line Items Table Header
  doc.setFillColor(...colors.tableHeader);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 8, "F");
  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Description", margin + 5, yPos + 6);
  doc.text("Amount", pageWidth - 30, yPos + 6);
  yPos += 12;

  // Line Items - Only show Labor/Services, Material Cost, and Tax (matching JobInfoSection)
  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");

  // Calculate values matching JobInfoSection.js calculation
  const billingMaterialCost = job.customMaterialCost !== undefined && job.customMaterialCost !== null
    ? Number(job.customMaterialCost)
    : 0;
  const jobPrice = Number(job.jobPrice) || 0;
  const subtotal = billingMaterialCost + jobPrice;
  const taxAmount = job.includeTax ? subtotal * 0.06 : 0;
  const totalCost = subtotal + taxAmount;

  // Labor and Services (Job Price)
  if (jobPrice > 0) {
    doc.text("Labor and Services", margin + 5, yPos + 4);
    doc.text(`$${jobPrice.toFixed(2)}`, pageWidth - 30, yPos + 4);
    yPos += 10;
    doc.setDrawColor(...colors.line);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  }

  // Material Cost (customMaterialCost - the billing material cost)
  if (billingMaterialCost > 0) {
    doc.text("Material Cost", margin + 5, yPos + 4);
    doc.text(`$${billingMaterialCost.toFixed(2)}`, pageWidth - 30, yPos + 4);
    yPos += 10;
    doc.setDrawColor(...colors.line);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  }

  yPos += 10;

  // Totals Section
  const totalsX = pageWidth - 80;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.text("Subtotal:", totalsX, yPos);
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 30, yPos);
  yPos += 8;

  // Tax (6%) if applicable
  if (job.includeTax) {
    doc.text("Tax (6%):", totalsX, yPos);
    doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - 30, yPos);
    yPos += 8;
  }

  // Calculate payments
  let totalPaid = 0;
  if (job.payments && job.payments.length > 0) {
    totalPaid = job.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    doc.text("Payments Received:", totalsX, yPos);
    doc.setTextColor(...colors.success);
    doc.text(`-$${totalPaid.toFixed(2)}`, pageWidth - 30, yPos);
    doc.setTextColor(...colors.text);
    yPos += 8;
  }

  // Total line
  yPos += 2;
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, yPos, pageWidth - margin, yPos);
  yPos += 8;

  const balanceDue = totalCost - totalPaid;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.primary);
  doc.text("Total:", totalsX, yPos);
  doc.text(`$${totalCost.toFixed(2)}`, pageWidth - 30, yPos);
  yPos += 10;

  // Balance Due
  if (balanceDue > 0) {
    doc.setTextColor(...colors.error);
  } else {
    doc.setTextColor(...colors.success);
  }
  doc.text("Balance Due:", totalsX, yPos);
  doc.text(`$${balanceDue.toFixed(2)}`, pageWidth - 30, yPos);
  doc.setTextColor(...colors.text);
  yPos += 10;

  // Check if we need a new page for payment info
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  // Payment Information
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  yPos = addText("Payment Information", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 3;

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPos = addText("Payment Methods: Zelle, Cash App, Check, Credit Card (3% fee), or Cash", margin, yPos);
  yPos = addText("Please include invoice number with your payment.", margin, yPos);

  // Payment History (if any)
  if (job.payments && job.payments.length > 0) {
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    yPos = addText("Payment History:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);

    job.payments.forEach((payment) => {
      const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "N/A";
      yPos = addText(
        `${paymentDate} - ${payment.paymentType || "Payment"} - $${(Number(payment.amount) || 0).toFixed(2)}${payment.checkNumber ? ` (Check #${payment.checkNumber})` : ""}`,
        margin + 10,
        yPos
      );
    });
  }

  // Footer
  yPos = 280;
  doc.setFontSize(9);
  doc.setTextColor(...colors.light);
  doc.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" });

  // Generate filename
  const customerName = (job.customer?.name || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  const filename = `Invoice_${customerName}_${job.id}_${date}.pdf`;

  // Save the PDF
  doc.save(filename);

  return filename;
};

export default generateInvoicePDF;
