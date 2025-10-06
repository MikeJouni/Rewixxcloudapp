import React from "react";
import MaterialForm from "../../forms/MaterialForm";

const MaterialFormModal = ({ 
  isOpen, 
  onClose, 
  jobId, 
  onAddMaterial, 
  products, 
  productsLoading, 
  productsError,
  queryClient 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[60] p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add Material</h3>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <MaterialForm
          jobId={jobId}
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={async (payload) => {
            try {
              // If NEW product, create it first then add
              if (payload.material && payload.material.productId === null && payload.material.customName) {
                const productPayload = {
                  name: payload.material.customName,
                  unitPrice: payload.material.unitPrice || 0,
                  description: `Custom product: ${payload.material.customName}`,
                };
                const productService = await import("../../../services/productService");
                const created = await productService.createProduct(productPayload);
                if (!created || !created.id) throw new Error("Failed to create product");
                
                // Invalidate products query to refresh dropdown
                queryClient.invalidateQueries({ queryKey: ["products"] });
                payload = {
                  ...payload,
                  material: {
                    ...payload.material,
                    productId: created.id,
                  }
                };
              }
              await onAddMaterial(payload);
              onClose();
            } catch (e) {
              console.error("Failed to add material:", e);
            }
          }}
          onCancel={onClose}
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
        />
      </div>
    </div>
  );
};

export default MaterialFormModal;
