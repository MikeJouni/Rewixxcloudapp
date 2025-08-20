import React, { useState, useEffect } from "react";
import BarcodeScannerModal from "../modals/BarcodeScannerModal";

const MaterialForm = ({ onSubmit, onCancel, products = [], isMobile = false, productsLoading = false, productsError = null }) => {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
    notes: "",
  });
  const [showScanner, setShowScanner] = useState(false);

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];
  
  // Debug products data
  useEffect(() => {
    console.log("MaterialForm received products:", products);
    console.log("Safe products array:", safeProducts);
  }, [products, safeProducts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Guard without blocking popups
    if (!formData.productId || !formData.quantity) {
      console.warn("Product and quantity are required");
      return;
    }
    onSubmit({
      ...formData,
      productId: parseInt(formData.productId),
      quantity: parseInt(formData.quantity),
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Add Material to Job</h2>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          📱 Scan Barcode
        </button>
      </div>
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
                No products available. Please create a product first.
              </option>
            )}
          </select>
          {safeProducts.length === 0 && (
            <p className="text-sm text-red-500 mt-1">
              No products found. Please check if the backend is running and products exist.
            </p>
          )}
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
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional notes about this material"
          />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Add Material
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onProductFound={(materialData) => {
          // Forward barcode material through the existing pipeline
          onSubmit(materialData);
          setShowScanner(false);
        }}
        isMobile={isMobile}
      />
    </div>
  );
};

export default MaterialForm;
