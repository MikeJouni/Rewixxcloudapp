import React from "react";

const MaterialsSection = ({ 
  materials, 
  job, 
  onAddMaterial, 
  onScanBarcode, 
  onProcessReceipt, 
  onRemoveMaterial
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mt-3">
      <div className="mb-3">
        <h3 className="text-sm sm:text-base font-semibold mb-2">Materials ({materials.length})</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAddMaterial}
            className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Add Material
          </button>
          <button
            onClick={onScanBarcode}
            className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Scan Barcode
          </button>
          <button
            onClick={onProcessReceipt}
            className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Process Receipt
          </button>
        </div>
      </div>
      
      {materials.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[250px] overflow-y-auto">
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
                      <td className="px-3 py-2 text-sm">
                        <span className="text-gray-900">{material.quantity}</span>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900 text-sm">
                        ${(material.price * material.quantity).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => onRemoveMaterial(material.id)}
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
          <div className="md:hidden space-y-2 max-h-[250px] overflow-y-auto">
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
                    onClick={() => onRemoveMaterial(material.id)}
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
