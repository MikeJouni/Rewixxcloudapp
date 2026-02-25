import React, { useState, useImperativeHandle, forwardRef } from "react";

const MaterialForm = forwardRef(({ onSubmit, onCancel, products = [], isMobile = false, productsLoading = false, productsError = null, jobId }, ref) => {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
    customName: "",
  });
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productPickerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (productPickerRef.current && !productPickerRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset form when jobId changes (when opening for a different job)
  React.useEffect(() => {
    setFormData({
      productId: "",
      quantity: "",
      unitPrice: "",
      customName: "",
    });
  }, [jobId]);

  // Deduplicate by name+unitPrice
  const dedupedProducts = React.useMemo(() => {
    // Ensure products is always an array
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
  


  // Expose submit method to parent component
  useImperativeHandle(ref, () => ({
    submit: () => {
      const isNewProduct = formData.productId === "NEW";
      if ((!(formData.productId) && !isNewProduct) || !formData.quantity) {
        return false;
      }
      if (isNewProduct && (!formData.customName || !formData.unitPrice)) {
        return false;
      }
      
      const materialData = {
        ...formData,
        productId: formData.productId && formData.productId !== "NEW" ? parseInt(formData.productId) : null,
        quantity: parseInt(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        source: "Manual Entry"
      };
      
      console.log('MaterialForm calling onSubmit with:', {
        jobId: jobId,
        material: materialData
      });
      onSubmit({
        jobId: jobId,
        material: materialData
      });
      
      return true;
    },
    getFormData: () => formData
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('MaterialForm handleSubmit called with formData:', formData);
    
    // Guard without blocking popups
    const isNewProduct = formData.productId === "NEW";
    if ((!(formData.productId) && !isNewProduct) || !formData.quantity) {
      console.log('MaterialForm validation failed - missing productId or quantity');
      return;
    }
    if (isNewProduct && (!formData.customName || !formData.unitPrice)) {
      console.log('MaterialForm validation failed - missing customName or unitPrice for NEW product');
      return;
    }
    
    const materialData = {
      ...formData,
      productId: formData.productId && formData.productId !== "NEW" ? parseInt(formData.productId) : null,
      quantity: parseInt(formData.quantity),
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
      source: "Manual Entry"
    };
    
    console.log('MaterialForm calling onSubmit with:', {
      jobId: jobId,
      material: materialData
    });
    onSubmit({
      jobId: jobId,
      material: materialData
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white rounded-lg">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div>
          <label className="block mb-2 font-bold">Product *</label>
          <div className="relative" ref={productPickerRef}>
            <input
              type="text"
              value={productSearchTerm}
              onChange={(e) => {
                setProductSearchTerm(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowProductDropdown(false);
              }}
              placeholder="Search by product name..."
              className="w-full p-2 border border-gray-300 rounded"
            />
            {showProductDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                <div
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-blue-600"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, productId: "NEW" }));
                    setProductSearchTerm("");
                    setShowProductDropdown(false);
                  }}
                >
                  + Create new product
                </div>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          productId: String(product.id),
                          // if no unit price entered, keep it empty so backend can default to product.unitPrice
                        }));
                        setProductSearchTerm(product.name);
                        setShowProductDropdown(false);
                      }}
                    >
                      <div className="flex justify-between">
                        <span>{product.name}</span>
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
        </div>
        
        {formData.productId === "NEW" && (
          <>
            <div>
              <label className="block mb-2 font-bold">Product Name *</label>
              <input
                type="text"
                name="customName"
                value={formData.customName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
          </>
        )}
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
            Unit Price{formData.productId === "NEW" ? " *" : ""}
          </label>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.01"
            min="0"
            required={formData.productId === "NEW"}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.productId === "NEW"
              ? "Enter a unit price for the new product."
              : "Leave empty to use the product's default price."}
          </p>
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add Material
          </button>
        </div>
      </form>
    </div>
  );
});

export default MaterialForm;
