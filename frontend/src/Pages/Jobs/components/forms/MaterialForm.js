import React, { useState, useImperativeHandle, forwardRef } from "react";
import BarcodeScannerModal from "../modals/BarcodeScannerModal";

const MaterialForm = forwardRef(({ onSubmit, onCancel, products = [], isMobile = false, productsLoading = false, productsError = null }, ref) => {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
  });
  const [showScanner, setShowScanner] = useState(false);

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];
  


  // Expose submit method to parent component
  useImperativeHandle(ref, () => ({
    submit: () => {
      if (!formData.productId || !formData.quantity) {
        return false;
      }
      
      const materialData = {
        ...formData,
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        source: "Manual Entry"
      };
      
      onSubmit(materialData);
      
      return true;
    },
    getFormData: () => formData
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Guard without blocking popups
    if (!formData.productId || !formData.quantity) {
      return;
    }
    
    const materialData = {
      ...formData,
      productId: parseInt(formData.productId),
      quantity: parseInt(formData.quantity),
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
      source: "Manual Entry"
    };
    
    onSubmit(materialData);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="mb-4 flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          📱 Scan Barcode
        </button>
      </div>
      
      {/* Barcode Data Banner */}
      {/* Removed as barcodeData state is removed */}
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-bold">Product *</label>
          <select
            name="productId"
            value={formData.productId}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select a product</option>
            {safeProducts.length > 0 ? (
              safeProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.unitPrice}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No products available
              </option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit Price
          </label>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.01"
            min="0"
            placeholder="Leave empty to use product default"
          />
        </div>
        <div className="md:col-span-2 flex gap-3">
          {/* Buttons removed - now handled by action buttons in table */}
        </div>
      </form>
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onProductFound={(materialData) => {
          // Ensure barcode material has proper structure and source
          const barcodeMaterial = {
            ...materialData,
            source: "Barcode Scan"
          };
          // Forward barcode material through the existing pipeline
          onSubmit(barcodeMaterial);
          setShowScanner(false);
        }}
        isMobile={isMobile}
      />
    </div>
  );
});

export default MaterialForm;
