import React, { useState, useEffect } from 'react';
import BarcodeScannerModal from './BarcodeScannerModal';

const JobDetailModal = ({ job, isOpen, onClose, onUpdateJob }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    price: '',
    quantity: 1,
    supplier: '',
    category: '',
    notes: ''
  });

  useEffect(() => {
    // Detect if device is mobile
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  if (!isOpen || !job) return null;

  const handleAddMaterial = (material) => {
    const materialWithId = {
      ...material,
      id: Date.now() + Math.random(),
      addedAt: new Date().toISOString()
    };

    const updatedJob = {
      ...job,
      materials: [...(job.materials || []), materialWithId],
      totalCost: (job.totalCost || 0) + (material.price * material.quantity)
    };

    onUpdateJob(updatedJob);
    setNewMaterial({
      name: '',
      price: '',
      quantity: 1,
      supplier: '',
      category: '',
      notes: ''
    });
    setShowManualEntry(false);
  };

  const handleBarcodeScan = (materialData) => {
    // Use the complete materialData object passed from the barcode scanner
    // This includes the correct quantity, total, and all other fields
    handleAddMaterial(materialData);
    setShowBarcodeScanner(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!newMaterial.name.trim()) return;

    const material = {
      ...newMaterial,
      price: parseFloat(newMaterial.price) || 0,
      quantity: parseInt(newMaterial.quantity) || 1
    };

    handleAddMaterial(material);
  };

  const removeMaterial = (materialId) => {
    const materialToRemove = job.materials?.find(m => m.id === materialId);
    const updatedJob = {
      ...job,
      materials: job.materials?.filter(m => m.id !== materialId) || [],
      totalCost: (job.totalCost || 0) - (materialToRemove?.price * materialToRemove?.quantity || 0)
    };

    onUpdateJob(updatedJob);
  };

  const updateMaterialQuantity = (materialId, newQuantity) => {
    const updatedMaterials = job.materials?.map(material => {
      if (material.id === materialId) {
        const quantityDiff = newQuantity - material.quantity;
        const costDiff = material.price * quantityDiff;
        
        return {
          ...material,
          quantity: newQuantity
        };
      }
      return material;
    });

    const updatedJob = {
      ...job,
      materials: updatedMaterials
    };

    // Recalculate total cost
    updatedJob.totalCost = updatedMaterials?.reduce((total, material) => {
      return total + (material.price * material.quantity);
    }, 0) || 0;

    onUpdateJob(updatedJob);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-[95vw] max-h-[95vh] overflow-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0">Job #{job.id} - {job.title}</h2>
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
            onClick={() => setActiveTab('details')}
            className={`px-3 py-3 border-none rounded-t cursor-pointer ${
              activeTab === 'details' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Job Details
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-3 border-none rounded-t cursor-pointer ${
              activeTab === 'materials' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Materials ({job.materials?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3 py-3 border-none rounded-t cursor-pointer ${
              activeTab === 'receipts' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Receipts ({job.receipts?.length || 0})
          </button>
        </div>

        {/* Job Details Tab */}
        {activeTab === 'details' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <strong>Customer:</strong> {job.customerName}
              </div>
              <div>
                <strong>Status:</strong> 
                <span className={`font-bold ${
                  job.status === 'Pending' ? 'text-yellow-500' : 
                  job.status === 'In Progress' ? 'text-blue-500' : 
                  job.status === 'Completed' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {job.status}
                </span>
              </div>
              <div>
                <strong>Priority:</strong> 
                <span className={`font-bold ${
                  job.priority === 'Low' ? 'text-green-500' : 
                  job.priority === 'Medium' ? 'text-yellow-500' : 
                  job.priority === 'High' ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {job.priority}
                </span>
              </div>
              <div>
                <strong>Total Cost:</strong> ${job.totalCost?.toFixed(2) || '0.00'}
              </div>
              <div>
                <strong>Start Date:</strong> {job.startDate}
              </div>
              <div>
                <strong>End Date:</strong> {job.endDate}
              </div>
              <div>
                <strong>Estimated Hours:</strong> {job.estimatedHours}
              </div>
              <div>
                <strong>Actual Hours:</strong> {job.actualHours || 0}
              </div>
            </div>
            <div>
              <strong>Description:</strong>
              <p className="mt-2 p-4 bg-gray-100 rounded">
                {job.description}
              </p>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div>
            {/* Add Materials Section */}
            <div className="mb-4 p-4 bg-gray-100 rounded">
              <h3 className="mb-2">Add Materials</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="px-4 py-2 bg-green-500 text-white border-none rounded cursor-pointer"
                >
                  📱 Scan Barcode
                </button>
                <button
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer"
                >
                  ✏️ Manual Entry
                </button>
              </div>

              {/* Manual Entry Form */}
              {showManualEntry && (
                <form onSubmit={handleManualSubmit} className="mt-4 p-4 bg-white rounded">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-bold">Name *</label>
                      <input
                        type="text"
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-bold">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMaterial.price}
                        onChange={(e) => setNewMaterial({...newMaterial, price: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-bold">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={newMaterial.quantity}
                        onChange={(e) => setNewMaterial({...newMaterial, quantity: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-bold">Supplier</label>
                      <input
                        type="text"
                        value={newMaterial.supplier}
                        onChange={(e) => setNewMaterial({...newMaterial, supplier: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-bold">Category</label>
                      <input
                        type="text"
                        value={newMaterial.category}
                        onChange={(e) => setNewMaterial({...newMaterial, category: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-bold">Notes</label>
                      <input
                        type="text"
                        value={newMaterial.notes}
                        onChange={(e) => setNewMaterial({...newMaterial, notes: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-green-500 text-white border-none rounded cursor-pointer">
                      Add Material
                    </button>
                    <button type="button" onClick={() => setShowManualEntry(false)} className="px-4 py-2 bg-gray-300 text-gray-800 border-none rounded cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Materials List */}
            <div>
              <h3 className="mb-2">Materials List</h3>
              {job.materials && job.materials.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left border-b border-gray-300">Name</th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">Price</th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">Qty</th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">Total</th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">Supplier</th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.materials.map((material) => (
                        <tr key={material.id} className="border-b border-gray-200">
                          <td className="px-4 py-2">
                            <div>
                              <strong>{material.name}</strong>
                              {material.category && (
                                <div className="text-sm text-gray-500">{material.category}</div>
                              )}
                              {material.notes && (
                                <div className="text-sm text-gray-500 italic">{material.notes}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">${material.price?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              value={material.quantity}
                              onChange={(e) => updateMaterialQuantity(material.id, parseInt(e.target.value) || 1)}
                              className="w-16 p-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">${(material.price * material.quantity).toFixed(2)}</td>
                          <td className="px-4 py-2">{material.supplier || 'N/A'}</td>
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
                  No materials added yet. Use the buttons above to add materials.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === 'receipts' && (
          <div>
            <h3 className="mb-2">Receipts</h3>
            {job.receipts && job.receipts.length > 0 ? (
              <div className="grid gap-4 grid-cols-auto-fit">
                {job.receipts.map((receipt) => (
                  <div key={receipt.id} className="border border-gray-200 rounded p-4">
                    <h4 className="mb-2">
                      {receipt.name}
                    </h4>
                    <p className="mb-2 text-sm text-gray-500">
                      Uploaded: {new Date(receipt.uploadedAt).toLocaleDateString()}
                    </p>
                    
                    {receipt.extractedData && (
                      <div className="mb-2 p-2 bg-gray-100 rounded">
                        <div className="text-sm leading-6">
                          <p className="mb-1">
                            <strong>Vendor:</strong> {receipt.extractedData.vendor || 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Date:</strong> {receipt.extractedData.date || 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Total:</strong> ${receipt.extractedData.total?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <img 
                      src={receipt.data} 
                      alt={receipt.name}
                      className="w-full h-auto rounded border border-gray-200"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 p-4">
                No receipts attached to this job yet.
              </p>
            )}
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <BarcodeScannerModal
            isOpen={showBarcodeScanner}
            onClose={() => setShowBarcodeScanner(false)}
            onProductFound={handleBarcodeScan}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
};

export default JobDetailModal; 