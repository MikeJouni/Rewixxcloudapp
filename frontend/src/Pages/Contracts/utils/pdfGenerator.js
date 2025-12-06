import { jsPDF } from "jspdf";

export const generateContractPDF = async (contract, accountSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper function to add text
  const addText = (text, x, y, options = {}) => {
    doc.setFontSize(options.fontSize || 12);
    doc.setFont("helvetica", options.fontStyle || "normal");
    doc.text(text || "", x, y, options);
    return y + (options.lineHeight || 7);
  };

  // Helper function to draw a line
  const drawLine = (y) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    return y + 5;
  };

  // Header - Company Name
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(102, 126, 234); // Brand color
  doc.text(contract.companyName || accountSettings?.companyName || "Company Name", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Company Contact Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
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
  yPos += 5;

  // Document Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("CONTRACT AGREEMENT", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Contract Details Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(102, 126, 234);
  yPos = addText("Contract Details", margin, yPos, { fontSize: 14, fontStyle: "bold" });
  yPos += 2;

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  yPos = addText(`Date: ${contract.date || contract.contractDate || new Date().toLocaleDateString()}`, margin, yPos);
  yPos = addText(`Status: ${contract.status || "UNPAID"}`, margin, yPos);
  yPos += 5;

  // Customer Information
  doc.setTextColor(102, 126, 234);
  yPos = addText("Customer Information", margin, yPos, { fontSize: 14, fontStyle: "bold" });
  yPos += 2;

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  yPos = addText(`Name: ${contract.customerName || "N/A"}`, margin, yPos);
  yPos = addText(`Address: ${contract.customerAddress || "N/A"}`, margin, yPos);
  yPos += 5;

  // Scope of Work
  doc.setTextColor(102, 126, 234);
  yPos = addText("Scope of Work", margin, yPos, { fontSize: 14, fontStyle: "bold" });
  yPos += 2;

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");

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
    yPos += 6;
  });
  yPos += 5;

  // Pricing Section
  doc.setTextColor(102, 126, 234);
  yPos = addText("Pricing", margin, yPos, { fontSize: 14, fontStyle: "bold" });
  yPos += 2;

  doc.setTextColor(50, 50, 50);
  const totalPrice = parseFloat(contract.totalPrice || 0);
  const depositPercent = parseInt(contract.depositPercent || 50);
  const depositAmount = totalPrice * (depositPercent / 100);
  const balanceDue = totalPrice - depositAmount;

  doc.setFont("helvetica", "normal");
  yPos = addText(`Total Price (Labor & Materials): $${totalPrice.toFixed(2)}`, margin, yPos);
  yPos = addText(`Deposit (${depositPercent}%): $${depositAmount.toFixed(2)}`, margin, yPos);
  yPos = addText(`Balance Due Upon Completion: $${balanceDue.toFixed(2)}`, margin, yPos);
  yPos += 5;

  // Payment Methods
  doc.setTextColor(102, 126, 234);
  yPos = addText("Payment Methods", margin, yPos, { fontSize: 14, fontStyle: "bold" });
  yPos += 2;

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  const paymentMethods = contract.paymentMethods || "Zelle, Cash App, Check, Credit Card (3% fee), or Cash";
  const paymentLines = doc.splitTextToSize(paymentMethods, pageWidth - (margin * 2));
  paymentLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 6;
  });
  yPos += 5;

  // Warranty
  doc.setTextColor(102, 126, 234);
  yPos = addText("Warranty", margin, yPos, { fontSize: 14, fontStyle: "bold" });
  yPos += 2;

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
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

  doc.setTextColor(102, 126, 234);
  yPos = addText("Signatures", margin, yPos, { fontSize: 14, fontStyle: "bold" });
  yPos += 10;

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");

  // Customer Signature
  doc.text("Customer Signature:", margin, yPos);
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
  doc.setTextColor(150, 150, 150);
  doc.text("This contract is legally binding upon signature by both parties.", pageWidth / 2, yPos, { align: "center" });

  // Generate filename
  const customerName = (contract.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const date = (contract.date || contract.contractDate || new Date().toISOString().split("T")[0]).replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `Contract_${customerName}_${date}.pdf`;

  // Save the PDF
  doc.save(filename);

  return filename;
};
