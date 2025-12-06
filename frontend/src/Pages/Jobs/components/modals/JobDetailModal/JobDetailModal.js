import React, { useState, useMemo, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "../../../../../components/ConfirmModal";
import BarcodeScannerModal from "../BarcodeScannerModal";
import ReceiptUploadModal from "../ReceiptUploadModal";
import JobInfoSection from "./JobInfoSection";
import MaterialsSection from "./MaterialsSection";
import PaymentsSection from "./PaymentsSection";
import ReceiptLoadingModal from "./ReceiptLoadingModal";

const JobDetailModal = ({
  job,
  isOpen,
  onClose,
  onUpdateJob,
  onRemoveReceipt,
  onClearAllReceipts,
  onRemoveMaterial,
  onUpdateMaterial,
  onAddMaterial,
  onAddReceipt,
  onCompleteJob,
  products,
  productsLoading,
  productsError,
  showReceiptLoading,
  setShowReceiptLoading
}) => {
  const queryClient = useQueryClient();
  const jobInfoRef = useRef(null);

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Local state for live cost updates (so Payment button appears immediately)
  const [liveMaterialCost, setLiveMaterialCost] = useState(job?.customMaterialCost || 0);
  const [liveJobPrice, setLiveJobPrice] = useState(job?.jobPrice || 0);
  const [liveIncludeTax, setLiveIncludeTax] = useState(job?.includeTax || false);

  // Callback to update live costs from JobInfoSection
  const handleLiveCostUpdate = useCallback((updates) => {
    if (updates.customMaterialCost !== undefined) {
      setLiveMaterialCost(updates.customMaterialCost);
    }
    if (updates.jobPrice !== undefined) {
      setLiveJobPrice(updates.jobPrice);
    }
    if (updates.includeTax !== undefined) {
      setLiveIncludeTax(updates.includeTax);
    }
  }, []);

  // Extract materials from sales data (do NOT aggregate - show each addition separately)
  const materials = useMemo(() => {
    if (!job || !job.sales) return [];

    const allMaterials = [];
    job.sales.forEach((sale) => {
      if (sale.saleItems) {
        sale.saleItems.forEach((saleItem) => {
          if (saleItem.product) {
            const material = {
              id: saleItem.id,
              name: saleItem.product.name,
              price: parseFloat(saleItem.unitPrice || saleItem.product.unitPrice || 0),
              quantity: saleItem.quantity || 1,
              supplier: sale.supplier?.username || "N/A",
              category: saleItem.product.category || "N/A",
              notes: sale.description || "",
              saleId: sale.id,
              productId: saleItem.product.id
            };
            allMaterials.push(material);
          }
        });
      }
    });
    // Return all materials without aggregation so each can be removed individually
    return allMaterials;
  }, [job]);

  // Calculate actual material cost from added materials
  const actualMaterialCost = useMemo(() => {
    if (!materials || materials.length === 0) return 0;
    return materials.reduce((sum, material) => {
      return sum + (material.price * material.quantity);
    }, 0);
  }, [materials]);

  // Calculate total cost (customMaterialCost + jobPrice + tax) for billing
  // Uses live values so the Add Payment button appears immediately when costs are entered
  const totalCost = useMemo(() => {
    const materialCost = liveMaterialCost || 0;
    const jobPriceVal = liveJobPrice || 0;
    const subtotal = materialCost + jobPriceVal;
    const tax = liveIncludeTax ? subtotal * 0.06 : 0;
    return subtotal + tax;
  }, [liveMaterialCost, liveJobPrice, liveIncludeTax]);

  if (!isOpen || !job) return null;

  const removeMaterial = (materialId) => {
    if (onRemoveMaterial) {
      const material = materials.find(m => m.id === materialId);
      if (material && material.saleId) {
        onRemoveMaterial({ jobId: job.id, materialId: material.saleId });
      }
    }
  };

  const handleCompleteJob = () => {
    setShowCompleteConfirm(false);
    if (onCompleteJob) onCompleteJob(job.id);
  };

  // Handle modal close with auto-save of pending changes
  const handleClose = async () => {
    // Save any unsaved material cost or job price changes before closing
    if (jobInfoRef.current) {
      await jobInfoRef.current.saveAllPendingChanges();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 overflow-y-auto" onClick={handleClose}>
      <div className="bg-white w-full min-h-screen sm:min-h-0 sm:rounded-lg sm:max-w-4xl sm:my-4 sm:mx-4 md:my-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex justify-between items-center z-10">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold m-0 truncate pr-2">
            Job #{job.id} - {job.title}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-2xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 pb-8">

        {/* Job Details */}
        <JobInfoSection
          ref={jobInfoRef}
          job={job}
          totalCost={totalCost}
          actualMaterialCost={actualMaterialCost}
          onCompleteJob={() => setShowCompleteConfirm(true)}
          onUpdateJob={onUpdateJob}
          onLiveCostUpdate={handleLiveCostUpdate}
        />

        {/* Payments Section */}
        <PaymentsSection job={job} totalCost={totalCost} />

        {/* Materials Section */}
        <MaterialsSection
          materials={materials}
          job={job}
          onAddMaterial={onAddMaterial}
          onScanBarcode={() => setShowBarcodeScanner(true)}
          onProcessReceipt={() => setShowReceiptModal(true)}
          onRemoveMaterial={removeMaterial}
          onUpdateMaterial={onUpdateMaterial}
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
        />

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <BarcodeScannerModal
            jobId={job.id}
            isOpen={showBarcodeScanner}
            onClose={() => setShowBarcodeScanner(false)}
            onProductFound={onAddMaterial}
            isMobile={/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}
          />
        )}

        {/* Receipt Upload Modal */}
        {showReceiptModal && (
          <ReceiptUploadModal
            jobId={job.id}
            isOpen={showReceiptModal}
            isProcessing={showReceiptLoading}
            onClose={() => {
              setShowReceiptModal(false);
              setShowReceiptLoading(false);
            }}
            onAddReceipt={async (file, jobId) => {
              try {
                // Show loading state and keep modal open to show processing
                setShowReceiptLoading(true);
                
                // Handle receipt upload and show verification
                await onAddReceipt(file, jobId);
                
              } catch (error) {
                console.error("Receipt upload failed:", error);
              } finally {
                // Always close modal and reset loading state
                setShowReceiptModal(false);
                setShowReceiptLoading(false);
              }
            }}
          />
        )}

        {/* Confirm Complete Modal */}
        <ConfirmModal
          isOpen={showCompleteConfirm}
          title="Complete Job"
          message={
            "Mark this job as Complete?\n\nNote: You can still edit job details, notes, and materials even after completion."
          }
          confirmLabel="Complete Job"
          cancelLabel="Cancel"
          confirmButtonClass="bg-emerald-500 hover:bg-emerald-600"
          onCancel={() => setShowCompleteConfirm(false)}
          onConfirm={handleCompleteJob}
        />

        {/* Receipt Loading Modal */}
        <ReceiptLoadingModal isOpen={showReceiptLoading} />
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
