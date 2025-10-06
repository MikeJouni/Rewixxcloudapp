import React, { useState, useEffect } from "react";
import ProgressSteps from "./ProgressSteps";
import ItemsReviewStep from "./ItemsReviewStep";
import MissingItemsStep from "./MissingItemsStep";
import ConfirmationStep from "./ConfirmationStep";

const ReceiptVerificationModal = ({
  isOpen,
  onClose,
  receiptData,
  onVerify,
  jobId,
}) => {
  const [items, setItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [missingItems, setMissingItems] = useState([]);
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (receiptData) {
      setItems(receiptData.items || []);

      // Calculate if there are missing items by comparing to SUBTOTAL (not total)
      const extractedTotal =
        receiptData.items?.reduce((sum, item) => sum + (item.total || 0), 0) ||
        0;
      const veryfiSubtotal = receiptData.subtotal || 0;

      // Use Math.abs() to handle floating-point precision issues (-0.00 vs 0.00)
      // Only add missing items if there's a significant difference (more than 1 cent)
      if (Math.abs(extractedTotal - veryfiSubtotal) > 0.01) {
        setMissingItems([
          {
            id: Date.now(),
            name: "Missing Item",
            price: 0,
            quantity: 1,
            total: veryfiSubtotal - extractedTotal,
          },
        ]);
        // Start at step 1 if there are missing items
        setCurrentStep(1);
      } else {
        setMissingItems([]);
        // Skip directly to step 3 if no missing items
        setCurrentStep(3);
      }
    }
  }, [receiptData]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]:
        field === "price" || field === "quantity" || field === "total"
          ? parseFloat(value) || 0
          : value,
    };
    setItems(updatedItems);
  };

  const handleMissingItemChange = (index, field, value) => {
    const updatedMissingItems = [...missingItems];
    updatedMissingItems[index] = {
      ...updatedMissingItems[index],
      [field]:
        field === "price" || field === "quantity" || field === "total"
          ? parseFloat(value) || 0
          : value,
    };
    setMissingItems(updatedMissingItems);
  };

  const addMissingItem = () => {
    setMissingItems([
      ...missingItems,
      {
        id: Date.now(),
        name: "",
        price: 0,
        quantity: 1,
        total: 0,
      },
    ]);
  };

  const removeMissingItem = (index) => {
    setMissingItems(missingItems.filter((_, i) => i !== index));
  };

  const handleVerify = async () => {
    setIsProcessing(true);
    setStatus("Processing receipt verification...");
    
    try {
      const allItems = [...items, ...missingItems];
      // Use the receipt total (including tax) as the final total, not just the sum of items
      const finalTotal = receiptData.total || 0;

      setStatus(`Adding ${allItems.length} items to job...`);

      const receiptDataToSend = {
        receipt_id: `receipt_${Date.now()}`,
        items: allItems,
        total: finalTotal,
      };

      // Call onVerify and wait for it to complete
      await onVerify(receiptDataToSend);
      
      setStatus("✅ Materials added successfully! Closing modal...");
      
      // Wait a moment to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (!isOpen || !receiptData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-[95vw] max-h-[95vh] overflow-auto w-[500px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Confirm Receipt</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} />

        {/* Step 1: Review Extracted Items */}
        {currentStep === 1 && (
          <ItemsReviewStep
            receiptData={receiptData}
            items={items}
            onItemChange={handleItemChange}
            onNext={nextStep}
          />
        )}

        {/* Step 2: Add Missing Items */}
        {currentStep === 2 && (
          <MissingItemsStep
            receiptData={receiptData}
            items={items}
            missingItems={missingItems}
            onMissingItemChange={handleMissingItemChange}
            onAddMissingItem={addMissingItem}
            onRemoveMissingItem={removeMissingItem}
            onPrev={prevStep}
            onNext={nextStep}
          />
        )}

        {/* Step 3: Confirm */}
        {currentStep === 3 && (
          <ConfirmationStep
            receiptData={receiptData}
            items={items}
            missingItems={missingItems}
            status={status}
            isProcessing={isProcessing}
            onPrev={prevStep}
            onConfirm={handleVerify}
          />
        )}
      </div>
    </div>
  );
};

export default ReceiptVerificationModal;
