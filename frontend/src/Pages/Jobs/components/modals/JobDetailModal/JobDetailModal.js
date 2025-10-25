import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "../../../../../components/ConfirmModal";
import BarcodeScannerModal from "../BarcodeScannerModal";
import ReceiptUploadModal from "../ReceiptUploadModal";
import JobInfoSection from "./JobInfoSection";
import MaterialsSection from "./MaterialsSection";
import MaterialFormModal from "./MaterialFormModal";
import ReceiptLoadingModal from "./ReceiptLoadingModal";

const JobDetailModal = ({ 
  job, 
  isOpen, 
  onClose, 
  onUpdateJob, 
  onRemoveReceipt, 
  onClearAllReceipts, 
  onRemoveMaterial,
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
  
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Extract materials from sales data
  const materials = useMemo(() => {
    if (!job || !job.sales) return [];
    
    const allMaterials = [];
    job.sales.forEach(sale => {
      if (sale.saleItems) {
        sale.saleItems.forEach(saleItem => {
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
    // Aggregate by name+price
    const map = new Map();
    for (const m of allMaterials) {
      const key = `${m.name.toLowerCase()}|${m.price.toFixed(2)}`;
      if (!map.has(key)) map.set(key, { ...m });
      else map.get(key).quantity += m.quantity;
    }
    return Array.from(map.values());
  }, [job]);

  // Calculate total cost from materials
  const totalCost = useMemo(() => {
    return materials.reduce((total, material) => {
      return total + (material.price * material.quantity);
    }, 0);
  }, [materials]);

  if (!isOpen || !job) return null;

  const removeMaterial = (materialId) => {
    if (onRemoveMaterial) {
      const material = materials.find(m => m.id === materialId);
      if (material && material.productId) {
        onRemoveMaterial({ jobId: job.id, materialId: material.productId });
      }
    }
  };

  const handleCompleteJob = () => {
    setShowCompleteConfirm(false);
    if (onCompleteJob) onCompleteJob(job.id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-2 sm:p-4 pt-24 sm:pt-4">
      <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 max-w-[98vw] sm:max-w-[95vw] max-h-[85vh] sm:max-h-[95vh] overflow-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold m-0 leading-tight">
            Job #{job.id} - {job.title}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl sm:text-3xl text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 leading-none"
          >
            ×
          </button>
        </div>

        {/* Job Details */}
        <JobInfoSection 
          job={job} 
          totalCost={totalCost} 
          onCompleteJob={() => setShowCompleteConfirm(true)}
          onUpdateJob={onUpdateJob}
        />

        {/* Materials Section */}
        <MaterialsSection
          materials={materials}
          job={job}
          onAddMaterial={() => setShowMaterialForm(true)}
          onScanBarcode={() => setShowBarcodeScanner(true)}
          onProcessReceipt={() => setShowReceiptModal(true)}
          onRemoveMaterial={removeMaterial}
        />

        {/* Material Form Modal */}
        <MaterialFormModal
          isOpen={showMaterialForm}
          onClose={() => setShowMaterialForm(false)}
          jobId={job.id}
          onAddMaterial={onAddMaterial}
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
          queryClient={queryClient}
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
  );
};

export default JobDetailModal;
