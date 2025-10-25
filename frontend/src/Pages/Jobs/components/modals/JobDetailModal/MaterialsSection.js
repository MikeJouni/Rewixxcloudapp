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
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Materials ({materials.length})</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAddMaterial}
            className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded text-xs sm:text-sm hover:bg-blue-600 transition-colors"
          >
            Add Material
          </button>
          <button
            onClick={onScanBarcode}
            className="px-2 sm:px-3 py-1 bg-purple-500 text-white rounded text-xs sm:text-sm hover:bg-purple-600 transition-colors"
          >
            Scan Barcode
          </button>
          <button
            onClick={onProcessReceipt}
            className="px-2 sm:px-3 py-1 bg-green-500 text-white rounded text-xs sm:text-sm hover:bg-green-600 transition-colors"
          >
            Process Receipt
          </button>
        </div>
      </div>
      
      {materials.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materials.map((material, idx) => (
                    <tr key={material.id ?? `${material.name}-${material.price}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{material.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        ${material.price?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900">{material.quantity}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        ${(material.price * material.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
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
          <div className="md:hidden space-y-2 max-h-[400px] overflow-y-auto">
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
        <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No materials added yet</h3>
          <p className="text-sm sm:text-base text-gray-500">Use the buttons above to add materials to this job</p>
        </div>
      )}
    </div>
  );
};

export default MaterialsSection;
