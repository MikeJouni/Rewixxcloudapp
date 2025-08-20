import React, { useState, useEffect, useMemo } from "react";
import BarcodeScannerModal from "./BarcodeScannerModal";

const JobDetailModal = ({ job, isOpen, onClose, onUpdateJob, onRemoveReceipt, onClearAllReceipts, onRemoveMaterial }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [localReceipts, setLocalReceipts] = useState([]);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    price: "",
    quantity: 1,
    supplier: "",
    category: "",
    notes: "",
  });

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
    return allMaterials;
  }, [job]);

  // Calculate total cost from materials
  const totalCost = useMemo(() => {
    return materials.reduce((total, material) => {
      return total + (material.price * material.quantity);
    }, 0);
  }, [materials]);

  useEffect(() => {
    // Detect if device is mobile
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    setIsMobile(isMobileDevice);
  }, []);
  
  // Load receipts from localStorage when modal opens
  useEffect(() => {
    if (isOpen && job) {
      try {
        const storedReceipts = localStorage.getItem(`job_receipts_${job.id}`);
        if (storedReceipts) {
          const receipts = JSON.parse(storedReceipts);
          setLocalReceipts(receipts);
        } else {
          setLocalReceipts([]);
        }
      } catch (error) {
        console.error("Error loading receipts from localStorage:", error);
        setLocalReceipts([]);
      }
    }
  }, [isOpen, job]);



  if (!isOpen || !job) return null;

  const handleAddMaterial = (material) => {
    // This function now just calls the parent's onUpdateJob
    // The actual material addition is handled by the backend API
    // and will be reflected when the job data is refreshed
    onUpdateJob(job);
  };

  const handleBarcodeScan = (materialData) => {
    // For barcode scanned materials, we need to create a product first and then add it as a material
    // This will be handled by the parent component through the backend API
    // Pass the material data to the parent for processing
    onUpdateJob(job, materialData);
    setShowBarcodeScanner(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!newMaterial.name.trim()) return;

    const material = {
      ...newMaterial,
      price: parseFloat(newMaterial.price) || 0,
      quantity: parseInt(newMaterial.quantity) || 1,
    };

    handleAddMaterial(material);
  };

  const removeMaterial = (materialId) => {
    if (onRemoveMaterial) {
      // Find the material to get the productId
      const material = materials.find(m => m.id === materialId);
      
      if (material && material.productId) {
        onRemoveMaterial({ jobId: job.id, materialId: material.productId });
      }
    }
  };

  const updateMaterialQuantity = (materialId, newQuantity) => {
    // For now, we'll just refresh the job data
    // In a real implementation, you'd call a backend API to update the quantity
    onUpdateJob(job);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-[95vw] max-h-[95vh] overflow-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0">
            Job #{job.id} - {job.title}
          </h2>
          <button
            onClick={onClose}
            className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-3 py-3 border-none rounded-t cursor-pointer ${
              activeTab === "details"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Job Details
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-3 py-3 border-none rounded-t cursor-pointer ${
              activeTab === "materials"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab("receipts")}
            className={`px-3 py-3 border-none rounded-t cursor-pointer ${
              activeTab === "receipts"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Receipts ({localReceipts.length})
          </button>
        </div>

        {/* Job Details Tab */}
        {activeTab === "details" && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <strong>Customer:</strong> {job.customerName}
              </div>
              <div>
                <strong>Status:</strong>
                <span
                  className={`font-bold ${
                    job.status === "Pending"
                      ? "text-yellow-500"
                      : job.status === "In Progress"
                      ? "text-blue-500"
                      : job.status === "Completed"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <div>
                <strong>Priority:</strong>
                <span
                  className={`font-bold ${
                    job.priority === "Low"
                      ? "text-green-500"
                      : job.priority === "Medium"
                      ? "text-yellow-500"
                      : job.priority === "High"
                      ? "text-orange-500"
                      : "text-red-500"
                  }`}
                >
                  {job.priority}
                </span>
              </div>
              <div>
                <strong>Total Cost:</strong> $
                {totalCost.toFixed(2)}
              </div>
              <div>
                <strong>Start Date:</strong> {job.startDate}
              </div>
              <div>
                <strong>Estimated End Date:</strong> {job.endDate}
              </div>
            </div>
            <div>
              <strong>Description:</strong>
              <p className="mt-2 p-4 bg-gray-100 rounded">{job.description}</p>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === "materials" && (
          <div>
            {/* Materials List */}
            <div>
              <h3 className="mb-2">Materials List</h3>
              {materials && materials.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Price
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Total
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Supplier
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((material) => (
                        <tr
                          key={material.id}
                          className="border-b border-gray-200"
                        >
                          <td className="px-4 py-2">
                            <div>
                              <strong>{material.name}</strong>
                              {material.category && (
                                <div className="text-sm text-gray-500">
                                  {material.category}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            ${material.price?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              value={material.quantity}
                              onChange={(e) =>
                                updateMaterialQuantity(
                                  material.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 p-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            ${(material.price * material.quantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            {material.supplier || "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => removeMaterial(material.id)}
                              className="px-2 py-1 bg-red-500 text-white border-none rounded text-sm cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 p-4">
                  No materials added yet. Use the buttons above to add
                  materials.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === "receipts" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="mb-2">Receipts ({localReceipts.length})</h3>
              {localReceipts.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to remove all receipts for this job?")) {
                      onClearAllReceipts && onClearAllReceipts(job.id);
                    }
                  }}
                  className="px-3 py-1 bg-red-500 text-white border-none rounded text-sm cursor-pointer hover:bg-red-600"
                >
                  Clear All Receipts
                </button>
              )}
            </div>

            {localReceipts.length > 0 ? (
              <div className="grid gap-4 grid-cols-auto-fit">
                {localReceipts.map((receipt, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded p-4"
                  >
                    <h4 className="mb-2">Receipt {index + 1}</h4>
                    <p className="mb-2 text-sm text-gray-500">
                      Uploaded: {new Date(receipt.uploadedAt).toLocaleDateString()}
                    </p>

                    <img
                      src={receipt.data}
                      alt={`Receipt ${index + 1}`}
                      className="w-full h-auto rounded border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-center text-gray-500 p-4">
                      Image failed to load
                    </div>
                    <button
                      onClick={() => {
                        onRemoveReceipt(job.id, index);
                      }}
                      className="mt-2 px-2 py-1 bg-red-500 text-white border-none rounded text-sm cursor-pointer"
                    >
                      Remove Receipt
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 p-4">
                No receipts attached to this job yet.
              </div>
            )}
          </div>
        )}

        {/* Barcode Scanner Modal removed in details view; materials are added from table */}
      </div>
    </div>
  );
};

export default JobDetailModal;
