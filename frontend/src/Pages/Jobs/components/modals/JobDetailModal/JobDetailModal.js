import React, { useState, useMemo, useRef } from "react";
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
  const totalCost = useMemo(() => {
    const materialCost = job.customMaterialCost || 0;
    const jobPrice = job.jobPrice || 0;
    const subtotal = materialCost + jobPrice;
    const tax = job.includeTax ? subtotal * 0.06 : 0;
    return subtotal + tax;
  }, [job]);

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
    <div className="fixed inset-0 bg-black/90 flex items-start sm:items-center justify-center z-50 p-2 sm:p-3 pt-16 sm:pt-20 md:pt-24" onClick={handleClose}>
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[calc(100vh-4rem)] sm:max-h-[90vh] md:max-h-[88vh] lg:max-h-[88vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center z-10">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold m-0">
            Job #{job.id} - {job.title}
          </h2>
          <button
            onClick={handleClose}
            className="text-2xl sm:text-3xl text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-3 sm:p-4">

        {/* Job Details */}
        <JobInfoSection
          ref={jobInfoRef}
          job={job}
          totalCost={totalCost}
          actualMaterialCost={actualMaterialCost}
          onCompleteJob={() => setShowCompleteConfirm(true)}
          onUpdateJob={onUpdateJob}
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
