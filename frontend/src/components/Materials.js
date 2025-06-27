import React, { useState, useEffect } from 'react';
import BarcodeScannerModal from "./BarcodeScannerModal";

const Materials = () => {
  const [materials, setMaterials] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: '',
    sku: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unitPrice: '',
    supplier: ''
  });

  useEffect(() => {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const categories = ['All', 'Wire', 'Outlets', 'Breakers', 'Connectors', 'Tools', 'Fixtures', 'Other'];
  const stockStatuses = ['All', 'Low Stock', 'In Stock', 'Overstocked'];

  const getStockStatus = (material) => {
    if (material.currentStock <= material.minStock) return 'Low Stock';
    if (material.currentStock >= material.maxStock) return 'Overstocked';
    return 'In Stock';
  };

  const getStockColor = (material) => {
    const status = getStockStatus(material);
    switch(status) {
      case 'Low Stock': return '#e74c3c';
      case 'Overstocked': return '#f39c12';
      case 'In Stock': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || material.category === categoryFilter;
    const matchesStock = stockFilter === 'All' || getStockStatus(material) === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleAddMaterial = (e) => {
    e.preventDefault();
    const material = {
      id: materials.length + 1,
      ...newMaterial,
      currentStock: parseInt(newMaterial.currentStock),
      minStock: parseInt(newMaterial.minStock),
      maxStock: parseInt(newMaterial.maxStock),
      unitPrice: parseFloat(newMaterial.unitPrice),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setMaterials([...materials, material]);
    setNewMaterial({
      name: '',
      category: '',
      sku: '',
      currentStock: '',
      minStock: '',
      maxStock: '',
      unitPrice: '',
      supplier: ''
    });
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    setNewMaterial({
      ...newMaterial,
      [e.target.name]: e.target.value
    });
  };

  const updateStock = (id, newStock) => {
    setMaterials(materials.map(material => 
      material.id === id 
        ? { ...material, currentStock: newStock, lastUpdated: new Date().toISOString().split('T')[0] }
        : material
    ));
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <h2 className="component-title">Materials & Inventory</h2>
        <button 
          className="primary-button" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Material'}
        </button>
        <button
          className="primary-button"
          onClick={() => setShowBarcodeScanner(true)}
          disabled={!isMobile}
          style={{ marginLeft: '1rem', background: isMobile ? '#2ecc71' : '#ccc', color: isMobile ? '#fff' : '#888' }}
        >
          Scan Barcode
        </button>
      </div>

      {showBarcodeScanner && (
        <BarcodeScannerModal
          onDetected={(barcode) => {
            setShowBarcodeScanner(false);
            fetch(`http://localhost:8001/api/materials/barcode-lookup?barcode=${barcode}`)
              .then(res => res.json())
              .then(data => {
                setNewMaterial({
                  ...newMaterial,
                  name: data.name || '',
                  category: data.category || '',
                  sku: data.sku || barcode,
                  unitPrice: data.price ? parseFloat(data.price.replace(/[^0-9.]/g, "")) : '',
                  supplier: data.supplier || 'Home Depot'
                });
                setShowAddForm(true);
              });
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {showAddForm && (
        <form onSubmit={handleAddMaterial} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Add New Material</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Material Name</label>
              <input
                type="text"
                name="name"
                value={newMaterial.name}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={newMaterial.category}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select Category</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">SKU</label>
              <input
                type="text"
                name="sku"
                value={newMaterial.sku}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={newMaterial.supplier}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Stock</label>
              <input
                type="number"
                name="currentStock"
                value={newMaterial.currentStock}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Stock</label>
              <input
                type="number"
                name="minStock"
                value={newMaterial.minStock}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Stock</label>
              <input
                type="number"
                name="maxStock"
                value={newMaterial.maxStock}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="unitPrice"
                value={newMaterial.unitPrice}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                required
              />
            </div>
          </div>
          <button type="submit" className="primary-button">Add Material</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
          style={{ marginBottom: 0, flex: '1', minWidth: '200px' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-input"
          style={{ width: '150px', marginBottom: 0 }}
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="form-input"
          style={{ width: '150px', marginBottom: 0 }}
        >
          {stockStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Stock Status</th>
              <th>Current Stock</th>
              <th>Min/Max</th>
              <th>Unit Price</th>
              <th>Total Value</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(material => (
              <tr key={material.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{material.sku}</td>
                <td>{material.name}</td>
                <td>{material.category}</td>
                <td>
                  <span style={{ 
                    color: getStockColor(material), 
                    fontWeight: 'bold',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '3px',
                    backgroundColor: getStockColor(material) + '20'
                  }}>
                    {getStockStatus(material)}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{material.currentStock}</td>
                <td style={{ textAlign: 'center' }}>{material.minStock} / {material.maxStock}</td>
                <td style={{ textAlign: 'right' }}>${material.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  ${(material.currentStock * material.unitPrice).toFixed(2)}
                </td>
                <td>{material.supplier}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      onClick={() => {
                        const newStock = prompt(`Update stock for ${material.name}:`, material.currentStock);
                        if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
                          updateStock(material.id, parseInt(newStock));
                        }
                      }}
                    >
                      Update
                    </button>
                    <button style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMaterials.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '2rem' }}>
          No materials found matching your criteria.
        </p>
      )}
    </div>
  );
};

export default Materials;
