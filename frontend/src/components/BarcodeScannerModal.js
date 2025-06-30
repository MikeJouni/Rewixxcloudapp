import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScannerModal = ({ 
  isOpen, 
  onClose, 
  onProductFound,
  isMobile 
}) => {
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const lastScannedBarcode = useRef('');
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && isMobile) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startScanning();
      }, 100);
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [isOpen, isMobile]);

  const startScanning = async () => {
    try {
      console.log('🎥 Starting barcode scanner...');
      setError('');
      setScanning(true);
      lastScannedBarcode.current = '';
      setScannedBarcode('');
      
      // Create the scanner instance
      html5QrcodeRef.current = new Html5Qrcode("reader");
      
      // Get available cameras
      console.log('📱 Getting available cameras...');
      const devices = await Html5Qrcode.getCameras();
      console.log('📷 Available cameras:', devices);
      
      if (devices.length === 0) {
        throw new Error('No cameras found on this device');
      }
      
      // Find back camera (usually has "back" in the label)
      let backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      // If no back camera found, use the first available camera
      if (!backCamera && devices.length > 0) {
        backCamera = devices[0];
      }
      
      console.log('📷 Using camera:', backCamera.label);
      
      // Start scanning with the selected camera
      console.log('🚀 Starting scanner with camera ID:', backCamera.id);
      await html5QrcodeRef.current.start(
        { deviceId: backCamera.id },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false
        },
        onScanSuccess,
        onScanFailure
      );
      
      console.log('✅ Scanner started successfully');
      
    } catch (error) {
      console.error('💥 Error starting scanner:', error);
      
      // Only show error if it's a real camera issue
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (error.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else if (error.name === 'OverconstrainedError') {
        setError('Camera does not meet the required constraints.');
      }
      
      setScanning(false);
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log('🎯 Barcode detected:', decodedText);
    console.log('Full scan result:', decodedResult);
    
    // Prevent multiple scans of the same barcode
    if (decodedText === lastScannedBarcode.current) {
      console.log('🔄 Duplicate barcode, ignoring');
      return;
    }

    // Prevent multiple simultaneous requests
    if (loading) {
      console.log('⏳ Already loading, ignoring scan');
      return;
    }
    
    // Set the last scanned barcode to prevent duplicates
    lastScannedBarcode.current = decodedText;
    setScannedBarcode(decodedText);
    
    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Add a small delay to prevent rapid-fire scanning
    scanTimeoutRef.current = setTimeout(async () => {
      console.log('🚀 Making API call for barcode:', decodedText);
      // Use a more flexible API URL - can be updated via environment variables later
      const apiUrl = `https://1965-24-35-46-77.ngrok-free.app/api/materials/barcode-lookup?barcode=${encodeURIComponent(decodedText)}`;
      console.log('🔗 API URL:', apiUrl);
      setLoading(true);
      setError('');
      
      try {
        console.log('📡 Starting fetch request...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('📡 API Response status:', response.status);
        
        // Check if response is ok
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorText = await response.text();
            console.error('❌ API Error response:', errorText);
            errorMessage += `: ${errorText}`;
          } catch (e) {
            console.error('❌ Could not read error response');
          }
          throw new Error(errorMessage);
        }
        
        // Get response as text first, then parse as JSON
        const responseText = await response.text();
        console.log('📡 Raw response text:', responseText);
        
        if (!responseText.trim()) {
          throw new Error('Server returned empty response');
        }
        
        let productData;
        try {
          productData = JSON.parse(responseText);
          console.log('📦 Product data received:', productData);
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON:', jsonError);
          throw new Error(`Server returned invalid JSON: ${jsonError.message}`);
        }
        
        if (productData && productData.name) {
          console.log('✅ Product found, showing quantity selector');
          setProduct(productData);
          setShowQuantitySelector(true);
          await stopScanning();
        } else {
          console.log('❌ Product not found in response');
          setError('Product not found. Please try scanning again.');
          lastScannedBarcode.current = '';
        }
        
      } catch (error) {
        console.error('💥 Error fetching product:', error);
        
        let errorMessage = 'Failed to fetch product information';
        
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = 'Network error. Check your internet connection.';
        } else {
          errorMessage += `: ${error.message}`;
        }
        
        setError(errorMessage);
        lastScannedBarcode.current = '';
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay to prevent rapid scanning
  };

  const onScanFailure = (error) => {
    // Handle scan failure, but don't show error for normal scanning
    if (error && error.name !== 'NotFoundException') {
      console.error('Scanning error:', error);
    }
  };

  const handleQuantityConfirm = () => {
    if (product && quantity > 0) {
      const materialData = {
        id: Date.now(),
        name: product.name,
        price: parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0,
        quantity: quantity,
        total: (parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0) * quantity,
        supplier: product.supplier,
        category: product.category,
        sku: product.sku,
        url: product.url,
        image_url: product.image_url,
        description: product.description,
        availability: product.availability,
        source: 'Barcode Scan'
      };
      
      onProductFound(materialData);
      handleClose();
    }
  };

  const handleClose = async () => {
    await stopScanning();
    setProduct(null);
    setQuantity(1);
    setShowQuantitySelector(false);
    setError('');
    setScannedBarcode('');
    lastScannedBarcode.current = '';
    onClose();
  };

  const stopScanning = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        console.log('🛑 Stopping scanner...');
        await html5QrcodeRef.current.stop();
        console.log('✅ Scanner stopped successfully');
      } catch (error) {
        console.error('❌ Error stopping scanner:', error);
      }
    }
    html5QrcodeRef.current = null;
    setScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        width: '500px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>
            {showQuantitySelector ? 'Select Quantity' : 'Scan Barcode'}
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Scanner View */}
        {!showQuantitySelector && (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem', textAlign: 'center' }}>
              Point your camera at a product barcode
            </p>
            
            {/* Debug Info */}
            {scannedBarcode && (
              <div style={{
                backgroundColor: '#e8f5e8',
                color: '#2d5a2d',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}>
                🎯 Scanned: {scannedBarcode}
              </div>
            )}

            {error && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {loading && (
              <div style={{
                backgroundColor: '#d1ecf1',
                color: '#0c5460',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Loading product information...
              </div>
            )}
            
            <div 
              id="reader"
              style={{
                width: '100%',
                minHeight: '300px',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1rem',
                border: '2px solid #3498db'
              }}
            />
          </div>
        )}

        {/* Product Selection View */}
        {showQuantitySelector && product && (
          <div>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              backgroundColor: '#f8f9fa'
            }}>
              {/* Product Image */}
              {product.image_url && (
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    style={{
                      maxWidth: '150px',
                      maxHeight: '150px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              )}

              {/* Product Details */}
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                {product.name}
              </h4>
              
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                <div><strong>Price:</strong> {product.price}</div>
                {product.category && (
                  <div><strong>Category:</strong> {product.category}</div>
                )}
                {product.availability && (
                  <div><strong>Availability:</strong> {product.availability}</div>
                )}
                {product.description && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Description:</strong> {product.description}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Quantity:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1.2rem'
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '80px',
                    textAlign: 'center',
                    fontSize: '1.1rem'
                  }}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1.2rem'
                  }}
                >
                  +
                </button>
              </div>
              
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.75rem', 
                backgroundColor: '#e8f5e8', 
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                Total: ${((parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0) * quantity).toFixed(2)}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleQuantityConfirm}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Add to Materials
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerModal;