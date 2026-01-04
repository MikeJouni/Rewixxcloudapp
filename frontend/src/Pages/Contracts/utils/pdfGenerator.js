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
  // US Letter size: 8.5 x 11 inches = 215.9 x 279.4 mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter"
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~215.9mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~279.4mm
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const bottomMargin = 25; // Leave space at bottom of each page
  const maxY = pageHeight - bottomMargin; // ~254mm

  let yPos = 20;

  // Professional color palette
  const colors = {
    primary: [51, 51, 51],
    secondary: [102, 102, 102],
    text: [33, 33, 33],
    light: [150, 150, 150],
    line: [200, 200, 200],
    sectionHeader: [68, 68, 68],
  };

  // Helper to check if we need a new page
  const checkPageBreak = (neededSpace) => {
    if (yPos + neededSpace > maxY) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Helper to add section header
  const addSectionHeader = (title) => {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.sectionHeader);
    doc.text(title, margin, yPos);
    yPos += 6;
  };

  // Helper to add text with auto page break
  const addTextLine = (text, fontSize = 10, fontStyle = "normal") => {
    checkPageBreak(6);
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...colors.text);
    doc.text(text || "", margin, yPos);
    yPos += 5;
  };

  // Helper to add multi-line text with auto page break
  const addMultiLineText = (text, fontSize = 10) => {
    if (!text) return;
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 0.4; // Approximate line height in mm

    lines.forEach((line) => {
      checkPageBreak(lineHeight + 2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.text);
      doc.text(line, margin, yPos);
      yPos += lineHeight + 1;
    });
  };

  // Helper to draw horizontal line
  const drawLine = () => {
    doc.setDrawColor(...colors.line);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;
  };

  // ========== HEADER SECTION ==========

  // Try to load and add company logo
  const logoUrl = contract.companyLogoUrl || accountSettings?.logoUrl;
  if (logoUrl) {
    try {
      const baseUrl = window.location.origin.includes('localhost')
        ? 'http://localhost:8080'
        : window.location.origin;
      const fullLogoUrl = logoUrl.startsWith('http')
        ? logoUrl
        : `${baseUrl}${logoUrl}`;

      const logoBase64 = await loadImageAsBase64(fullLogoUrl);
      const logoSize = 18;
      doc.addImage(logoBase64, "PNG", (pageWidth - logoSize) / 2, yPos, logoSize, logoSize);
      yPos += logoSize + 3;
    } catch (error) {
      console.warn("Could not load logo for PDF:", error);
    }
  }

  // Company Name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text(contract.companyName || accountSettings?.companyName || "Company Name", pageWidth / 2, yPos, { align: "center" });
  yPos += 6;

  // Company Contact Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);

  const companyAddress = contract.companyAddress || accountSettings?.address || "";
  const companyPhone = contract.companyPhone || accountSettings?.phone || "";
  const companyEmail = contract.companyEmail || accountSettings?.email || "";

  if (companyAddress) {
    doc.text(companyAddress, pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
  }
  if (companyPhone || companyEmail) {
    doc.text(`${companyPhone}${companyPhone && companyEmail ? " | " : ""}${companyEmail}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
  }
  if (contract.licenseNumber || contract.idNumber) {
    doc.text(`License: ${contract.licenseNumber || "N/A"} | ID: ${contract.idNumber || "N/A"}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
  }

  yPos += 3;
  drawLine();
  yPos += 5;

  // ========== CONTRACT TITLE ==========
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("SERVICE CONTRACT", pageWidth / 2, yPos, { align: "center" });
  yPos += 6;

  // Contract Number and Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);

  const contractNumber = contract.contractNumber || "";
  const contractDate = contract.date || contract.contractDate || new Date().toLocaleDateString();

  if (contractNumber) {
    doc.text(`Contract #: ${contractNumber}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
  }
  doc.text(`Date: ${contractDate}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  // ========== PARTIES SECTION (side by side) ==========
  const colWidth = contentWidth / 2 - 5;
  const leftCol = margin;
  const rightCol = margin + colWidth + 10;

  // Contractor Info (left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.sectionHeader);
  doc.text("CONTRACTOR", leftCol, yPos);

  // Customer Info (right)
  doc.text("CLIENT", rightCol, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.text);

  // Contractor details
  doc.text(contract.companyName || accountSettings?.companyName || "", leftCol, yPos);
  doc.text(contract.customerName || "N/A", rightCol, yPos);
  yPos += 4;

  if (companyAddress) {
    const addrLines = doc.splitTextToSize(companyAddress, colWidth);
    addrLines.forEach((line, i) => {
      doc.text(line, leftCol, yPos + (i * 4));
    });
  }

  if (contract.customerAddress) {
    const custAddrLines = doc.splitTextToSize(contract.customerAddress, colWidth);
    custAddrLines.forEach((line, i) => {
      doc.text(line, rightCol, yPos + (i * 4));
    });
  }

  yPos += 12;

  // ========== SCOPE OF WORK ==========
  addSectionHeader("SCOPE OF WORK");

  const scopeOfWork = contract.scopeOfWork || "N/A";
  addMultiLineText(scopeOfWork, 9);
  yPos += 5;

  // ========== PRICING ==========
  checkPageBreak(35);
  addSectionHeader("PROJECT COST & PAYMENT TERMS");

  const totalPrice = parseFloat(contract.totalPrice || 0);
  const depositPercent = parseInt(contract.depositPercent || 50);
  const depositAmount = totalPrice * (depositPercent / 100);
  const balanceDue = totalPrice - depositAmount;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.text);

  doc.text(`Total Contract Price (Labor & Materials):`, margin, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(`$${totalPrice.toFixed(2)}`, margin + 80, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.text(`Deposit Required (${depositPercent}%):`, margin, yPos);
  doc.text(`$${depositAmount.toFixed(2)}`, margin + 80, yPos);
  yPos += 5;

  doc.text(`Balance Due Upon Completion:`, margin, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(`$${balanceDue.toFixed(2)}`, margin + 80, yPos);
  yPos += 8;

  // Payment Methods
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const paymentMethods = contract.paymentMethods || "Zelle, Cash App, Check, Credit Card (3% fee), or Cash";
  doc.text("Accepted Payment Methods:", margin, yPos);
  yPos += 4;
  addMultiLineText(paymentMethods, 9);
  yPos += 3;

  // ========== WARRANTY ==========
  checkPageBreak(15);
  addSectionHeader("WARRANTY");
  addTextLine(contract.warranty || "2 years on workmanship", 9);
  yPos += 5;

  // ========== TERMS AND CONDITIONS ==========
  if (contract.termsAndConditions) {
    checkPageBreak(20);
    addSectionHeader("TERMS AND CONDITIONS");

    doc.setFontSize(8);
    const termsLines = doc.splitTextToSize(contract.termsAndConditions, contentWidth);

    termsLines.forEach((line) => {
      checkPageBreak(4);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.text);
      doc.text(line, margin, yPos);
      yPos += 3.5;
    });
    yPos += 5;
  }

  // ========== SIGNATURE SECTION ==========
  // Calculate space needed for signature section
  const signatureHeight = 55; // Total height needed for signature section

  // Check if signature fits on current page, if not add new page
  if (yPos + signatureHeight > maxY) {
    doc.addPage();
    yPos = 20;
  }

  drawLine();
  yPos += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.sectionHeader);
  doc.text("AGREEMENT & SIGNATURES", margin, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.text);
  doc.text("By signing below, both parties agree to the terms and conditions outlined in this contract.", margin, yPos);
  yPos += 10;

  // Two-column signatures
  const sigColWidth = contentWidth / 2 - 10;
  const sigRightCol = margin + sigColWidth + 20;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT", margin, yPos);
  doc.text("CONTRACTOR", sigRightCol, yPos);
  yPos += 12;

  // Signature lines
  doc.setDrawColor(...colors.line);
  doc.setLineWidth(0.3);

  // Client signature
  doc.line(margin, yPos, margin + sigColWidth, yPos);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Signature", margin, yPos + 4);

  // Contractor signature
  doc.line(sigRightCol, yPos, sigRightCol + sigColWidth, yPos);
  doc.text("Signature", sigRightCol, yPos + 4);
  yPos += 12;

  // Print Name lines
  doc.line(margin, yPos, margin + sigColWidth, yPos);
  doc.text("Print Name", margin, yPos + 4);

  doc.line(sigRightCol, yPos, sigRightCol + sigColWidth, yPos);
  doc.text("Print Name", sigRightCol, yPos + 4);
  yPos += 12;

  // Date lines
  doc.line(margin, yPos, margin + 40, yPos);
  doc.text("Date", margin, yPos + 4);

  doc.line(sigRightCol, yPos, sigRightCol + 40, yPos);
  doc.text("Date", sigRightCol, yPos + 4);
  yPos += 10;

  // ========== FOOTER ==========
  doc.setFontSize(8);
  doc.setTextColor(...colors.light);
  doc.text("Thank you for choosing " + (contract.companyName || accountSettings?.companyName || "us") + "!", pageWidth / 2, yPos, { align: "center" });

  // Generate filename
  const customerName = (contract.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const date = (contract.date || contract.contractDate || new Date().toISOString().split("T")[0]).replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `Contract_${customerName}_${date}.pdf`;

  // Save the PDF
  doc.save(filename);

  return filename;
};
