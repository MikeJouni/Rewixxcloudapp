import React, { useState, useEffect } from 'react';

const ReceiptVerificationModal = ({ 
  isOpen, 
  onClose, 
  receiptData, 
  onVerify, 
  jobId 
}) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [missingItems, setMissingItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', quantity: 1 });

  useEffect(() => {
    if (receiptData) {
      setItems(receiptData.items || []);
      setTotal(receiptData.total || 0);
      
      // Calculate if there are missing items by comparing to SUBTOTAL (not total)
      const extractedTotal = receiptData.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
      const veryfiSubtotal = receiptData.subtotal || 0;
      
      // Use Math.abs() to handle floating-point precision issues (-0.00 vs 0.00)
      // Only add missing items if there's a significant difference (more than 1 cent)
      if (Math.abs(extractedTotal - veryfiSubtotal) > 0.01) {
        setMissingItems([{
          id: Date.now(),
          name: 'Missing Item',
          price: 0,
          quantity: 1,
          total: veryfiSubtotal - extractedTotal
        }]);
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
      [field]: field === 'price' || field === 'quantity' || field === 'total' 
        ? parseFloat(value) || 0 
        : value
    };
    setItems(updatedItems);
    
    // Recalculate total
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    setTotal(newTotal);
  };

  const handleMissingItemChange = (index, field, value) => {
    const updatedMissingItems = [...missingItems];
    updatedMissingItems[index] = {
      ...updatedMissingItems[index],
      [field]: field === 'price' || field === 'quantity' || field === 'total' 
        ? parseFloat(value) || 0 
        : value
    };
    setMissingItems(updatedMissingItems);
  };

  const addMissingItem = () => {
    setMissingItems([...missingItems, {
      id: Date.now(),
      name: '',
      price: 0,
      quantity: 1,
      total: 0
    }]);
  };

  const removeMissingItem = (index) => {
    setMissingItems(missingItems.filter((_, i) => i !== index));
  };

  const handleVerify = () => {
    const allItems = [...items, ...missingItems];
    // Use the receipt total (including tax) as the final total, not just the sum of items
    const finalTotal = receiptData.total || 0;
    
    onVerify({
      receipt_id: `receipt_${Date.now()}`,
      items: allItems,
      total: finalTotal,
      notes: notes
    });
    
    onClose();
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (!isOpen || !receiptData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-[90vw] max-h-[90vh] overflow-auto w-[600px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Verify Receipt Data</h3>
          <button 
            onClick={onClose}
            className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex mb-6 gap-2">
          <div className={`px-4 py-2 rounded-full text-sm ${
            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            Step 1: Review Items
          </div>
          <div className={`px-4 py-2 rounded-full text-sm ${
            currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            Step 2: Add Missing Items
          </div>
          <div className={`px-4 py-2 rounded-full text-sm ${
            currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            Step 3: Confirm
          </div>
        </div>

        {/* Step 1: Review Extracted Items */}
        {currentStep === 1 && (
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Review Extracted Items</h4>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Please review and correct the items extracted from your receipt. 
              Pay special attention to prices and quantities.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Receipt Summary:</strong>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                <div>Vendor: {receiptData.vendor}</div>
                <div>Date: {receiptData.date}</div>
                <div>Extracted Items Total: ${items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</div>
                <div>Receipt Subtotal: ${receiptData.subtotal?.toFixed(2)}</div>
                <div>Receipt Tax: ${receiptData.tax?.toFixed(2)}</div>
                <div>Receipt Total: ${receiptData.total?.toFixed(2)}</div>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: Math.abs(items.reduce((sum, item) => sum + (item.total || 0), 0) - (receiptData.subtotal || 0)) > 0.01 ? '#e74c3c' : '#27ae60',
                  marginTop: '0.25rem'
                }}>
                  Items vs Subtotal: ${(items.reduce((sum, item) => sum + (item.total || 0), 0) - (receiptData.subtotal || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '1rem' }}>
              {items.map((item, index) => (
                <div key={index} style={{ 
                  border: '1px solid #eee', 
                  padding: '0.75rem', 
                  marginBottom: '0.5rem', 
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="Item name"
                      style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      placeholder="Price"
                      style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                    />
                    <div style={{ fontWeight: 'bold' }}>
                      ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button 
                onClick={nextStep}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Next: Add Missing Items
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add Missing Items */}
        {currentStep === 2 && (
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Add Missing Items</h4>
            {missingItems.length === 0 ? (
              <div>
                <p style={{ color: '#27ae60', marginBottom: '1rem', fontWeight: 'bold' }}>
                  ✅ Great! All items were extracted correctly. No missing items detected.
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Totals:</strong>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    <div>Extracted Items: ${items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</div>
                    <div>Receipt Subtotal: ${receiptData.subtotal?.toFixed(2)}</div>
                    <div>Receipt Tax: ${receiptData.tax?.toFixed(2)}</div>
                    <div>Receipt Total: ${receiptData.total?.toFixed(2)}</div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: '#27ae60',
                      marginTop: '0.25rem'
                    }}>
                      Difference: $0.00 ✅
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  If the extracted total doesn't match the receipt total, add the missing items below.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Totals:</strong>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    <div>Extracted Items: ${items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</div>
                    <div>Receipt Subtotal: ${receiptData.subtotal?.toFixed(2)}</div>
                    <div>Receipt Tax: ${receiptData.tax?.toFixed(2)}</div>
                    <div>Receipt Total: ${receiptData.total?.toFixed(2)}</div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: Math.abs(items.reduce((sum, item) => sum + (item.total || 0), 0) - (receiptData.subtotal || 0)) > 0.01 ? '#e74c3c' : '#27ae60',
                      marginTop: '0.25rem'
                    }}>
                      Difference: ${(receiptData.subtotal - items.reduce((sum, item) => sum + (item.total || 0), 0)).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '1rem' }}>
                  {missingItems.map((item, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #eee', 
                      padding: '0.75rem', 
                      marginBottom: '0.5rem', 
                      borderRadius: '4px',
                      backgroundColor: '#fff3cd'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleMissingItemChange(index, 'name', e.target.value)}
                          placeholder="Item name"
                          style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleMissingItemChange(index, 'price', e.target.value)}
                          placeholder="Price"
                          style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => handleMissingItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '3px' }}
                        />
                        <div style={{ fontWeight: 'bold' }}>
                          ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeMissingItem(index)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addMissingItem}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '1rem'
                  }}
                >
                  + Add Missing Item
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button 
                onClick={prevStep}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button 
                onClick={nextStep}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Next: Confirm
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {currentStep === 3 && (
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Confirm Receipt Data</h4>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Final Summary:</strong>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                <div>Vendor: {receiptData.vendor}</div>
                <div>Date: {receiptData.date}</div>
                <div>Total Items: {items.length + missingItems.length}</div>
                <div>Items Total: ${(items.reduce((sum, item) => sum + (item.total || 0), 0) + 
                                   missingItems.reduce((sum, item) => sum + (item.total || 0), 0)).toFixed(2)}</div>
                <div>Receipt Tax: ${receiptData.tax?.toFixed(2) || '0.00'}</div>
                <div style={{ fontWeight: 'bold', color: '#27ae60' }}>Final Total: ${receiptData.total?.toFixed(2) || '0.00'}</div>
              </div>
            </div>

            {/* Show complete list of all items for final review */}
            <div style={{ marginBottom: '1rem' }}>
              <strong>All Items to be Added:</strong>
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '1rem',
                marginTop: '0.5rem'
              }}>
                {/* Extracted Items */}
                {items.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#3498db' }}>Extracted Items ({items.length})</h5>
                    {items.map((item, index) => (
                      <div key={`extracted-${index}`} style={{ 
                        padding: '0.5rem', 
                        marginBottom: '0.25rem', 
                        backgroundColor: '#f8f9fa',
                        borderRadius: '3px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                          <div>${item.price?.toFixed(2)}</div>
                          <div>{item.quantity}</div>
                          <div style={{ fontWeight: 'bold', color: '#27ae60' }}>${item.total?.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Missing Items */}
                {missingItems.length > 0 && (
                  <div>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#e67e22' }}>Added Items ({missingItems.length})</h5>
                    {missingItems.map((item, index) => (
                      <div key={`missing-${index}`} style={{ 
                        padding: '0.5rem', 
                        marginBottom: '0.25rem', 
                        backgroundColor: '#fff3cd',
                        borderRadius: '3px',
                        border: '1px solid #ffeaa7'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                          <div>${item.price?.toFixed(2)}</div>
                          <div>{item.quantity}</div>
                          <div style={{ fontWeight: 'bold', color: '#e67e22' }}>${item.total?.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Summary */}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#e8f5e8', 
                  borderRadius: '4px',
                  border: '1px solid #c3e6c3'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 'bold' }}>ITEMS TOTAL:</div>
                    <div style={{ fontWeight: 'bold', color: '#27ae60' }}>
                      ${(items.reduce((sum, item) => sum + (item.total || 0), 0) + 
                         missingItems.reduce((sum, item) => sum + (item.total || 0), 0)).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    <div style={{ fontWeight: 'bold' }}>TAX:</div>
                    <div style={{ fontWeight: 'bold', color: '#e67e22' }}>
                      ${receiptData.tax?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', marginTop: '0.25rem', borderTop: '1px solid #c3e6c3', paddingTop: '0.25rem' }}>
                    <div style={{ fontWeight: 'bold' }}>FINAL TOTAL:</div>
                    <div style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '1rem' }}>
                      ${receiptData.total?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                <strong>Notes (optional):</strong>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this receipt..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button 
                onClick={prevStep}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button 
                onClick={handleVerify}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Confirm & Add to Job
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptVerificationModal; 