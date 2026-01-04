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

export const generateInvoicePDF = async (invoice, accountSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2; // 170mm usable width
  let yPos = 20;

  // Professional dark gray color palette (no blue)
  const colors = {
    primary: [31, 41, 55],      // Dark gray #1f2937
    secondary: [55, 65, 81],    // Medium gray #374151
    text: [31, 41, 55],         // Dark gray for text
    textLight: [107, 114, 128], // Light gray #6b7280
    line: [229, 231, 235],      // Border gray #e5e7eb
    tableHeader: [31, 41, 55],  // Dark gray for header
    tableAlt: [249, 250, 251],  // Light background #f9fafb
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  // Try to load and add company logo
  const logoUrl = invoice.logoUrl || accountSettings?.logoUrl;
  if (logoUrl) {
    try {
      const baseUrl = window.location.origin.includes("localhost")
        ? "http://localhost:8080"
        : window.location.origin;
      const fullLogoUrl = logoUrl.startsWith("http")
        ? logoUrl
        : `${baseUrl}${logoUrl}`;

      const logoBase64 = await loadImageAsBase64(fullLogoUrl);
      doc.addImage(logoBase64, "PNG", margin, yPos, 30, 15);
      yPos += 5;
    } catch (error) {
      console.warn("Could not load logo for PDF:", error);
    }
  }

  // INVOICE Title (right side)
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("INVOICE", pageWidth - margin, yPos + 10, { align: "right" });

  // Invoice number
  if (invoice.invoiceNumber) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textLight);
    doc.text(`#${invoice.invoiceNumber}`, pageWidth - margin, yPos + 18, {
      align: "right",
    });
  }

  yPos += 25;

  // Company Info (left side)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.text);
  doc.text(
    invoice.companyName || accountSettings?.companyName || "Company Name",
    margin,
    yPos
  );
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textLight);

  if (invoice.companyAddress || accountSettings?.address) {
    doc.text(invoice.companyAddress || accountSettings?.address, margin, yPos);
    yPos += 5;
  }
  if (invoice.companyPhone || accountSettings?.phone) {
    doc.text(
      `Phone: ${invoice.companyPhone || accountSettings?.phone}`,
      margin,
      yPos
    );
    yPos += 5;
  }
  if (invoice.companyEmail || accountSettings?.email) {
    doc.text(
      `Email: ${invoice.companyEmail || accountSettings?.email}`,
      margin,
      yPos
    );
    yPos += 5;
  }

  yPos += 5;

  // Horizontal line
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.75);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Bill To and Invoice Details side by side
  const colWidth = (pageWidth - margin * 2) / 2;

  // Bill To
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("BILL TO", margin, yPos);

  // Invoice Details
  doc.text("INVOICE DETAILS", margin + colWidth, yPos);
  yPos += 7;

  // Customer info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.text);
  doc.text(invoice.customerName || "Customer", margin, yPos);
  yPos += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textLight);

  let customerYPos = yPos;
  if (invoice.customerAddress) {
    const addressLines = doc.splitTextToSize(invoice.customerAddress, colWidth - 10);
    addressLines.forEach((line) => {
      doc.text(line, margin, customerYPos);
      customerYPos += 5;
    });
  }
  if (invoice.customerPhone) {
    doc.text(`Phone: ${invoice.customerPhone}`, margin, customerYPos);
    customerYPos += 5;
  }
  if (invoice.customerEmail) {
    doc.text(`Email: ${invoice.customerEmail}`, margin, customerYPos);
    customerYPos += 5;
  }

  // Invoice details (right side)
  let detailsYPos = yPos;
  doc.setTextColor(...colors.text);
  doc.text(`Invoice Date:`, margin + colWidth, detailsYPos);
  doc.text(
    invoice.invoiceDate || new Date().toLocaleDateString(),
    margin + colWidth + 60,
    detailsYPos
  );
  detailsYPos += 6;

  if (invoice.dueDate) {
    doc.text(`Due Date:`, margin + colWidth, detailsYPos);
    doc.text(invoice.dueDate, margin + colWidth + 60, detailsYPos);
    detailsYPos += 6;
  }

  if (invoice.paymentTerms) {
    doc.text(`Terms:`, margin + colWidth, detailsYPos);
    doc.text(invoice.paymentTerms, margin + colWidth + 60, detailsYPos);
    detailsYPos += 6;
  }

  yPos = Math.max(customerYPos, detailsYPos) + 15;

  // Check if we should show itemized or total only
  const showItemizedList = invoice.showItemizedList !== false;

  if (showItemizedList && invoice.lineItems && invoice.lineItems.length > 0) {
    // Line Items Table with better column widths
    const tableTop = yPos;
    const tableHeaderHeight = 10;
    const rowHeight = 10; // Increased row height for better readability

    // Better proportional column widths - description gets more space
    const colWidths = {
      description: contentWidth * 0.50,  // 50% for description
      qty: contentWidth * 0.12,          // 12% for qty
      unitPrice: contentWidth * 0.19,    // 19% for unit price
      total: contentWidth * 0.19,        // 19% for total
    };

    // Table Header
    doc.setFillColor(...colors.tableHeader);
    doc.rect(margin, tableTop, contentWidth, tableHeaderHeight, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);

    // Header text positions
    let xPos = margin + 4;
    doc.text("Description", xPos, tableTop + 7);

    xPos = margin + colWidths.description;
    doc.text("Qty", xPos + colWidths.qty / 2, tableTop + 7, { align: "center" });

    xPos += colWidths.qty;
    doc.text("Unit Price", xPos + colWidths.unitPrice / 2, tableTop + 7, { align: "center" });

    xPos += colWidths.unitPrice;
    doc.text("Total", xPos + colWidths.total / 2, tableTop + 7, { align: "center" });

    yPos = tableTop + tableHeaderHeight;

    // Table Rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);

    (invoice.lineItems || []).forEach((item, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(...colors.tableAlt);
        doc.rect(margin, yPos, contentWidth, rowHeight, "F");
      }

      doc.setFontSize(9);

      // Description - wrap text if needed
      const desc = item.description || "";
      const maxDescWidth = colWidths.description - 8;
      const descLines = doc.splitTextToSize(desc, maxDescWidth);
      const truncatedDesc = descLines[0] + (descLines.length > 1 ? "..." : "");
      doc.text(truncatedDesc, margin + 4, yPos + 6.5);

      // Quantity - centered in its column
      xPos = margin + colWidths.description;
      doc.text(String(item.quantity || 0), xPos + colWidths.qty / 2, yPos + 6.5, { align: "center" });

      // Unit Price - right aligned
      xPos += colWidths.qty;
      doc.text(formatCurrency(item.unitPrice), xPos + colWidths.unitPrice - 4, yPos + 6.5, { align: "right" });

      // Total - right aligned
      xPos += colWidths.unitPrice;
      const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
      doc.text(formatCurrency(lineTotal), xPos + colWidths.total - 4, yPos + 6.5, { align: "right" });

      yPos += rowHeight;
    });

    // Table border
    doc.setDrawColor(...colors.line);
    doc.setLineWidth(0.5);
    doc.rect(margin, tableTop, contentWidth, yPos - tableTop);

    // Draw column dividers
    let dividerX = margin + colWidths.description;
    doc.line(dividerX, tableTop, dividerX, yPos);
    dividerX += colWidths.qty;
    doc.line(dividerX, tableTop, dividerX, yPos);
    dividerX += colWidths.unitPrice;
    doc.line(dividerX, tableTop, dividerX, yPos);

    yPos += 10;
  }

  // Totals Section (right-aligned)
  const totalsWidth = 100;
  const totalsX = pageWidth - margin - totalsWidth;
  const totalsValueX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);

  // Subtotal (only show if itemized)
  if (showItemizedList) {
    doc.text("Subtotal:", totalsX, yPos);
    doc.text(formatCurrency(invoice.subtotal), totalsValueX, yPos, {
      align: "right",
    });
    yPos += 6;
  }

  // Tax
  if (invoice.includeTax) {
    doc.text("Tax (6%):", totalsX, yPos);
    doc.text(formatCurrency(invoice.taxAmount), totalsValueX, yPos, {
      align: "right",
    });
    yPos += 6;
  }

  // Grand Total
  yPos += 2;
  doc.setFillColor(...colors.primary);
  doc.roundedRect(totalsX - 5, yPos - 5, totalsWidth + 10, 14, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("Total Cost:", totalsX, yPos + 4);
  doc.text(formatCurrency(invoice.grandTotal), totalsValueX, yPos + 4, {
    align: "right",
  });

  yPos += 25;

  // Scope of Work section
  if (invoice.scopeOfWork) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.secondary);
    doc.text("SCOPE OF WORK", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textLight);
    doc.setFontSize(9);
    const scopeLines = doc.splitTextToSize(
      invoice.scopeOfWork,
      contentWidth
    );
    scopeLines.forEach((line) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 5;
  }

  // Notes section
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.secondary);
    doc.text("NOTES", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textLight);
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(
      invoice.notes,
      contentWidth
    );
    notesLines.forEach((line) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    });
  }

  // Footer
  yPos = 280;
  doc.setFontSize(9);
  doc.setTextColor(...colors.textLight);
  doc.text("Thank you for your business!", pageWidth / 2, yPos, {
    align: "center",
  });

  // Generate filename
  const customerName = (invoice.customerName || "Customer").replace(
    /[^a-zA-Z0-9]/g,
    "_"
  );
  const date = (
    invoice.invoiceDate || new Date().toISOString().split("T")[0]
  ).replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `Invoice_${customerName}_${date}.pdf`;

  // Save the PDF
  doc.save(filename);

  return filename;
};

// Get filename for invoice
export const getInvoiceFilename = (invoice) => {
  const customerName = (invoice.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const date = (invoice.invoiceDate || new Date().toISOString().split("T")[0]).replace(/[^a-zA-Z0-9]/g, "-");
  return `Invoice_${customerName}_${date}.pdf`;
};
