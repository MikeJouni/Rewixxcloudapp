import React, { useState, useEffect } from 'react';
import EnhancedBarcodeScannerModal from './EnhancedBarcodeScannerModal';

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        maxWidth: '95vw',
        maxHeight: '95vh',
        overflow: 'auto',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Job #{job.id} - {job.title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #ddd' }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: activeTab === 'details' ? '#3498db' : '#f8f9fa',
              color: activeTab === 'details' ? 'white' : '#333',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer'
            }}
          >
            Job Details
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: activeTab === 'materials' ? '#3498db' : '#f8f9fa',
              color: activeTab === 'materials' ? 'white' : '#333',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer'
            }}
          >
            Materials ({job.materials?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: activeTab === 'receipts' ? '#3498db' : '#f8f9fa',
              color: activeTab === 'receipts' ? 'white' : '#333',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer'
            }}
          >
            Receipts ({job.receipts?.length || 0})
          </button>
        </div>

        {/* Job Details Tab */}
        {activeTab === 'details' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <strong>Customer:</strong> {job.customerName}
              </div>
              <div>
                <strong>Status:</strong> 
                <span style={{ 
                  color: job.status === 'Pending' ? '#f39c12' : 
                         job.status === 'In Progress' ? '#3498db' : 
                         job.status === 'Completed' ? '#2ecc71' : '#e74c3c',
                  fontWeight: 'bold',
                  marginLeft: '0.5rem'
                }}>
                  {job.status}
                </span>
              </div>
              <div>
                <strong>Priority:</strong> 
                <span style={{ 
                  color: job.priority === 'Low' ? '#2ecc71' : 
                         job.priority === 'Medium' ? '#f39c12' : 
                         job.priority === 'High' ? '#e67e22' : '#e74c3c',
                  fontWeight: 'bold',
                  marginLeft: '0.5rem'
                }}>
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
              <p style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                {job.description}
              </p>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div>
            {/* Add Materials Section */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Add Materials</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  📱 Scan Barcode
                </button>
                <button
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Manual Entry
                </button>
              </div>

              {/* Manual Entry Form */}
              {showManualEntry && (
                <form onSubmit={handleManualSubmit} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Name *</label>
                      <input
                        type="text"
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMaterial.price}
                        onChange={(e) => setNewMaterial({...newMaterial, price: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={newMaterial.quantity}
                        onChange={(e) => setNewMaterial({...newMaterial, quantity: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Supplier</label>
                      <input
                        type="text"
                        value={newMaterial.supplier}
                        onChange={(e) => setNewMaterial({...newMaterial, supplier: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Category</label>
                      <input
                        type="text"
                        value={newMaterial.category}
                        onChange={(e) => setNewMaterial({...newMaterial, category: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Notes</label>
                      <input
                        type="text"
                        value={newMaterial.notes}
                        onChange={(e) => setNewMaterial({...newMaterial, notes: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2ecc71',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                      Add Material
                    </button>
                    <button type="button" onClick={() => setShowManualEntry(false)} style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Materials List */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0' }}>Materials List</h3>
              {job.materials && job.materials.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Price</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Qty</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Total</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Supplier</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.materials.map((material) => (
                        <tr key={material.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div>
                              <strong>{material.name}</strong>
                              {material.category && (
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{material.category}</div>
                              )}
                              {material.notes && (
                                <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>{material.notes}</div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>${material.price?.toFixed(2) || '0.00'}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <input
                              type="number"
                              min="1"
                              value={material.quantity}
                              onChange={(e) => updateMaterialQuantity(material.id, parseInt(e.target.value) || 1)}
                              style={{ width: '60px', padding: '0.25rem', border: '1px solid #ddd', borderRadius: '3px' }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem' }}>${(material.price * material.quantity).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem' }}>{material.supplier || 'N/A'}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              onClick={() => removeMaterial(material.id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
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
                <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                  No materials added yet. Use the buttons above to add materials.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === 'receipts' && (
          <div>
            <h3 style={{ margin: '0 0 1rem 0' }}>Receipts</h3>
            {job.receipts && job.receipts.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {job.receipts.map((receipt) => (
                  <div key={receipt.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{receipt.name}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                      Uploaded: {new Date(receipt.uploadedAt).toLocaleDateString()}
                    </p>
                    
                    {receipt.extractedData && (
                      <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '0.75rem', 
                        borderRadius: '4px', 
                        marginBottom: '0.75rem',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                          <p style={{ margin: '0.25rem 0' }}>
                            <strong>Vendor:</strong> {receipt.extractedData.vendor || 'N/A'}
                          </p>
                          <p style={{ margin: '0.25rem 0' }}>
                            <strong>Date:</strong> {receipt.extractedData.date || 'N/A'}
                          </p>
                          <p style={{ margin: '0.25rem 0' }}>
                            <strong>Total:</strong> ${receipt.extractedData.total?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <img 
                      src={receipt.data} 
                      alt={receipt.name}
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        borderRadius: '4px',
                        border: '1px solid #eee'
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                No receipts attached to this job yet.
              </p>
            )}
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <EnhancedBarcodeScannerModal
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