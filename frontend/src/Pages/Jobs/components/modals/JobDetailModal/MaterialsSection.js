import React from "react";

const MaterialsSection = ({ 
  materials, 
  job, 
  onAddMaterial, 
  onScanBarcode, 
  onProcessReceipt, 
  onRemoveMaterial, 
  onUpdateMaterialQuantity 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-3">Materials ({materials.length})</h3>
        {job.status === "IN_PROGRESS" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onAddMaterial}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Add Material
            </button>
            <button
              onClick={onScanBarcode}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
            >
              Scan Barcode
            </button>
            <button
              onClick={onProcessReceipt}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            >
              Process Receipt
            </button>
          </div>
        )}
      </div>
      
      {materials.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                      {job.status === "IN_PROGRESS" ? (
                        <input
                          type="number"
                          min="1"
                          value={material.quantity}
                          onChange={(e) =>
                            onUpdateMaterialQuantity(
                              material.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 p-1 border border-gray-300 rounded text-center"
                        />
                      ) : (
                        <span className="text-gray-900">{material.quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      ${(material.price * material.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {job.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => onRemoveMaterial(material.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials added yet</h3>
          <p className="text-gray-500">Use the buttons above to add materials to this job</p>
        </div>
      )}
    </div>
  );
};

export default MaterialsSection;
