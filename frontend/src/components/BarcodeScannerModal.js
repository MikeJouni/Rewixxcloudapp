import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import config from '../config';

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
      // Use API URL from config
      const apiUrl = `${config.API_BASE_URL}/api/materials/barcode-lookup?barcode=${encodeURIComponent(decodedText)}`;
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
    <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-[90vw] max-h-[90vh] overflow-auto w-[500px] relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="m-0">
            {showQuantitySelector ? 'Select Quantity' : 'Scan Barcode'}
          </h3>
          <button
            onClick={handleClose}
            className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Scanner View */}
        {!showQuantitySelector && (
          <div>
            <p className="text-gray-600 mb-4 text-center">
              Point your camera at a product barcode
            </p>
            
            {/* Debug Info */}
            {scannedBarcode && (
              <div className="bg-green-50 text-green-800 p-3 rounded mb-4 text-center font-mono text-sm">
                🎯 Scanned: {scannedBarcode}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded mb-4 text-center">
                {error}
              </div>
            )}

            {loading && (
              <div className="bg-blue-50 text-blue-800 p-3 rounded mb-4 text-center">
                Loading product information...
              </div>
            )}
            
            <div 
              id="reader"
              className="w-full min-h-[300px] rounded-lg overflow-hidden mb-4 border-2 border-blue-500"
            />
          </div>
        )}

        {/* Product Selection View */}
        {showQuantitySelector && product && (
          <div>
            <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
              {/* Product Image */}
              {product.image_url && (
                <div className="text-center mb-4">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="max-w-[150px] max-h-[150px] rounded border border-gray-300"
                  />
                </div>
              )}

              {/* Product Details */}
              <h4 className="m-0 mb-2 text-lg">
                {product.name}
              </h4>
              
              <div className="text-sm text-gray-600 mb-2">
                <div><strong>Price:</strong> {product.price}</div>
                {product.category && (
                  <div><strong>Category:</strong> {product.category}</div>
                )}
                {product.availability && (
                  <div><strong>Availability:</strong> {product.availability}</div>
                )}
                {product.description && (
                  <div className="mt-2">
                    <strong>Description:</strong> {product.description}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block mb-2 font-bold">
                Quantity:
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 bg-gray-600 text-white border-none rounded cursor-pointer text-xl hover:bg-gray-700"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="px-2 py-2 border border-gray-300 rounded w-20 text-center text-lg"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 bg-gray-600 text-white border-none rounded cursor-pointer text-xl hover:bg-gray-700"
                >
                  +
                </button>
              </div>
              
              <div className="mt-2 p-3 bg-green-50 rounded text-center font-bold">
                Total: ${((parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0) * quantity).toFixed(2)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center">
              <button
                onClick={handleQuantityConfirm}
                className="px-8 py-3 bg-green-600 text-white border-none rounded cursor-pointer text-base font-bold hover:bg-green-700"
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