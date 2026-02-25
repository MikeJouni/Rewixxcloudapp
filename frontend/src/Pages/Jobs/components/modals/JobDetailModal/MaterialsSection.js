import React, { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const MaterialsSection = ({
  materials,
  job,
  onAddMaterial,
  onScanBarcode,
  onProcessReceipt,
  onRemoveMaterial,
  products,
  productsLoading,
  productsError
}) => {
  const queryClient = useQueryClient();

  // Inline add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
    customName: "",
  });
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productPickerRef = useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (productPickerRef.current && !productPickerRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Deduplicate products by name+unitPrice
  const dedupedProducts = React.useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const map = new Map();
    for (const p of safeProducts) {
      const key = `${(p.name || '').toLowerCase()}|${Number(p.unitPrice || 0).toFixed(2)}`;
      if (!map.has(key)) map.set(key, p);
    }
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    const term = productSearchTerm.trim().toLowerCase();
    if (!term) return dedupedProducts;
    return dedupedProducts.filter(p => (p.name || "").toLowerCase().includes(term));
  }, [dedupedProducts, productSearchTerm]);

  const handleAddMaterialClick = () => {
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setFormData({
      productId: "",
      quantity: "",
      unitPrice: "",
      customName: "",
    });
    setProductSearchTerm("");
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();

    const isNewProduct = formData.productId === "NEW";
    if ((!formData.productId && !isNewProduct) || !formData.quantity) {
      alert("Please select a product and enter quantity");
      return;
    }
    if (isNewProduct && (!formData.customName || !formData.unitPrice)) {
      alert("Please enter product name and unit price for new product");
      return;
    }

    setIsSubmitting(true);

    try {
      let materialData = {
        productId: formData.productId && formData.productId !== "NEW" ? parseInt(formData.productId) : null,
        quantity: parseInt(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        source: "Manual Entry"
      };

      let payload = {
        jobId: job.id,
        material: materialData
      };

      // If NEW product, create it first then add
      if (isNewProduct && formData.customName) {
        const productPayload = {
          name: formData.customName,
          unitPrice: formData.unitPrice || 0,
          description: `Custom product: ${formData.customName}`,
        };
        const productService = await import("../../../services/productService");
        const created = await productService.createProduct(productPayload);
        if (!created || !created.id) throw new Error("Failed to create product");

        // Invalidate products query to refresh dropdown
        queryClient.invalidateQueries({ queryKey: ["products"] });

        payload = {
          ...payload,
          material: {
            ...materialData,
            productId: created.id,
          }
        };
      }

      await onAddMaterial(payload);
      handleCancelAdd();
    } catch (error) {
      console.error("Failed to add material:", error);
      alert("Failed to add material: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveClick = (material) => {
    onRemoveMaterial(material.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-4 mt-2 sm:mt-3">
      <div className="mb-2 sm:mb-3">
        <h3 className="text-sm sm:text-base font-semibold mb-2">Materials ({materials.length})</h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={handleAddMaterialClick}
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500 text-white rounded text-xs sm:text-sm hover:bg-blue-600 transition-colors"
          >
            + Add
          </button>
          <button
            onClick={onScanBarcode}
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-700 transition-colors"
          >
            Scan
          </button>
          <button
            onClick={onProcessReceipt}
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-700 transition-colors"
          >
            Receipt
          </button>
        </div>
      </div>

      {/* Inline Add Material Form */}
      {showAddForm && (
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800">Add New Material</h4>
            <button
              onClick={handleCancelAdd}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              type="button"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmitAdd} className="space-y-3">
            {/* Product Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <div className="relative" ref={productPickerRef}>
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => {
                    setProductSearchTerm(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={productsLoading}
                />
                {showProductDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    <div
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-blue-600 border-b border-gray-200 font-medium"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, productId: "NEW" }));
                        setProductSearchTerm("");
                        setShowProductDropdown(false);
                      }}
                    >
                      + Create new product
                    </div>
                    {productsLoading ? (
                      <div className="px-3 py-2 text-gray-500 text-center text-sm">Loading...</div>
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              productId: String(product.id),
                            }));
                            setProductSearchTerm(product.name);
                            setShowProductDropdown(false);
                          }}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-gray-600">${product.unitPrice}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center text-sm">No products found</div>
                    )}
                  </div>
                )}
              </div>
              {formData.productId && (
                <div className="mt-1 text-xs text-green-600">
                  ✓ {formData.productId === "NEW" ? "Creating new product" : "Product selected"}
                </div>
              )}
            </div>

            {/* New Product Name (if creating new) */}
            {formData.productId === "NEW" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.customName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter product name"
                />
              </div>
            )}

            {/* Quantity and Unit Price in a row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price {formData.productId === "NEW" && "*"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.productId === "NEW"}
                  min="0"
                  placeholder="Optional"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.productId === "NEW"
                    ? "Required for new product"
                    : "Leave empty to use default"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'Adding...' : '✓ Add Material'}
              </button>
              <button
                type="button"
                onClick={handleCancelAdd}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {materials.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[300px] sm:max-h-[350px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Total</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materials.map((material, idx) => (
                    <tr key={material.id ?? `${material.name}-${material.price}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{material.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-900 text-sm">
                        ${material.price?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {material.quantity}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900 text-sm">
                        ${(material.price * material.quantity).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleRemoveClick(material)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-2">
            {materials.map((material, idx) => (
              <div
                key={material.id ?? `${material.name}-${material.price}-${idx}`}
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-gray-900 text-sm break-words">{material.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      ${material.price?.toFixed(2) || "0.00"} each
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveClick(material)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Qty:</span>
                    <span className="text-sm font-medium text-gray-900">{material.quantity}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Total</div>
                    <div className="font-bold text-sm text-gray-900">
                      ${(material.price * material.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-4 sm:py-6 bg-gray-50 rounded-lg">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">No materials added yet</h3>
          <p className="text-xs sm:text-sm text-gray-500">Use the buttons above to add materials to this job</p>
        </div>
      )}
    </div>
  );
};

export default MaterialsSection;
