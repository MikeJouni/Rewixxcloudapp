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

export const generateContractPDF = async (contract, accountSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Professional color palette (neutral grays - matching invoice generator)
  const colors = {
    primary: [51, 51, 51],      // Dark gray for headers
    secondary: [102, 102, 102], // Medium gray for labels
    text: [33, 33, 33],         // Near black for body text
    light: [150, 150, 150],     // Light gray for subtle text
    line: [200, 200, 200],      // Light gray for lines
    sectionHeader: [68, 68, 68], // Section headers
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
  const logoUrl = contract.companyLogoUrl || accountSettings?.logoUrl;
  if (logoUrl) {
    try {
      // Construct full URL for the logo
      const baseUrl = window.location.origin.includes('localhost')
        ? 'http://localhost:8080'
        : window.location.origin;
      const fullLogoUrl = logoUrl.startsWith('http')
        ? logoUrl
        : `${baseUrl}${logoUrl}`;

      const logoBase64 = await loadImageAsBase64(fullLogoUrl);
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
  doc.text(contract.companyName || accountSettings?.companyName || "Company Name", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  // Company Contact Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  const companyAddress = contract.companyAddress || accountSettings?.address || "";
  const companyPhone = contract.companyPhone || accountSettings?.phone || "";
  const companyEmail = contract.companyEmail || accountSettings?.email || "";

  if (companyAddress) {
    doc.text(companyAddress, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (companyPhone || companyEmail) {
    doc.text(`${companyPhone}${companyPhone && companyEmail ? " | " : ""}${companyEmail}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }

  // License info
  if (contract.licenseNumber || contract.idNumber) {
    doc.text(`License: ${contract.licenseNumber || "N/A"} | ID: ${contract.idNumber || "N/A"}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }

  yPos += 5;
  yPos = drawLine(yPos);
  yPos += 8;

  // Document Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("CONTRACT AGREEMENT", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Contract Details Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.sectionHeader);
  yPos = addText("Contract Details", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 3;

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPos = addText(`Date: ${contract.date || contract.contractDate || new Date().toLocaleDateString()}`, margin, yPos);
  yPos = addText(`Status: ${contract.status || "UNPAID"}`, margin, yPos);
  yPos += 8;

  // Customer Information
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.sectionHeader);
  yPos = addText("Customer Information", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 3;

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPos = addText(`Name: ${contract.customerName || "N/A"}`, margin, yPos);
  yPos = addText(`Address: ${contract.customerAddress || "N/A"}`, margin, yPos);
  yPos += 8;

  // Scope of Work
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.sectionHeader);
  yPos = addText("Scope of Work", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 3;

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Handle multi-line scope of work
  const scopeOfWork = contract.scopeOfWork || "N/A";
  const scopeLines = doc.splitTextToSize(scopeOfWork, pageWidth - (margin * 2));
  scopeLines.forEach((line) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  yPos += 8;

  // Pricing Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.sectionHeader);
  yPos = addText("Pricing", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 3;

  doc.setTextColor(...colors.text);
  const totalPrice = parseFloat(contract.totalPrice || 0);
  const depositPercent = parseInt(contract.depositPercent || 50);
  const depositAmount = totalPrice * (depositPercent / 100);
  const balanceDue = totalPrice - depositAmount;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPos = addText(`Total Price (Labor & Materials): $${totalPrice.toFixed(2)}`, margin, yPos);
  yPos = addText(`Deposit (${depositPercent}%): $${depositAmount.toFixed(2)}`, margin, yPos);

  doc.setFont("helvetica", "bold");
  yPos = addText(`Balance Due Upon Completion: $${balanceDue.toFixed(2)}`, margin, yPos);
  doc.setFont("helvetica", "normal");
  yPos += 8;

  // Payment Methods
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.sectionHeader);
  yPos = addText("Payment Methods", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 3;

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const paymentMethods = contract.paymentMethods || "Zelle, Cash App, Check, Credit Card (3% fee), or Cash";
  const paymentLines = doc.splitTextToSize(paymentMethods, pageWidth - (margin * 2));
  paymentLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  yPos += 8;

  // Warranty
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.sectionHeader);
  yPos = addText("Warranty", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 3;

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPos = addText(contract.warranty || "2 years on workmanship", margin, yPos);
  yPos += 15;

  // Check if we need a new page for signatures
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Signature Section
  yPos = drawLine(yPos);
  yPos += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.sectionHeader);
  yPos = addText("Signatures", margin, yPos, { fontSize: 12, fontStyle: "bold" });
  yPos += 10;

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Customer Signature
  doc.text("Customer Signature:", margin, yPos);
  doc.setDrawColor(...colors.line);
  doc.line(margin + 45, yPos, margin + 120, yPos);
  doc.text("Date:", margin + 130, yPos);
  doc.line(margin + 145, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Contractor Signature
  doc.text("Contractor Signature:", margin, yPos);
  doc.line(margin + 50, yPos, margin + 120, yPos);
  doc.text("Date:", margin + 130, yPos);
  doc.line(margin + 145, yPos, pageWidth - margin, yPos);
  yPos += 20;

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(...colors.light);
  doc.text("This contract is legally binding upon signature by both parties.", pageWidth / 2, yPos, { align: "center" });
  yPos += 5;
  doc.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" });

  // Generate filename
  const customerName = (contract.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const date = (contract.date || contract.contractDate || new Date().toISOString().split("T")[0]).replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `Contract_${customerName}_${date}.pdf`;

  // Save the PDF
  doc.save(filename);

  return filename;
};
