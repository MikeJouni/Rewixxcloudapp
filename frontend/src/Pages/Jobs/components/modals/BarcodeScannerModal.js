import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "antd";
import { Html5Qrcode } from "html5-qrcode";
import config from "../../../../config";

const BarcodeScannerModal = ({ isOpen, onClose, onProductFound, isMobile, jobId }) => {
  const queryClient = useQueryClient();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const html5QrcodeRef = useRef(null);
  const lastScannedBarcode = useRef("");
  const scanTimeoutRef = useRef(null);

  const stopScanning = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (error) {
        console.error("❌ Error stopping scanner:", error);
      }
    }
    html5QrcodeRef.current = null;
  }, []);

  const onScanSuccess = useCallback(
    async (decodedText, decodedResult) => {
      // Prevent multiple scans of the same barcode
      if (decodedText === lastScannedBarcode.current) {
        return;
      }

      // Prevent multiple simultaneous requests
      if (loading) {
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
        // Use API URL from config
        const apiUrl = `${
          config.PYTHON_API_BASE
        }/api/materials/barcode-lookup?barcode=${encodeURIComponent(
          decodedText
        )}`;
        setLoading(true);
        setError("");

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Check if response is ok
          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorText = await response.text();
              errorMessage += `: ${errorText}`;
            } catch (e) {
              // Could not read error response
            }
            throw new Error(errorMessage);
          }

          // Get response as text first, then parse as JSON
          const responseText = await response.text();

          if (!responseText.trim()) {
            throw new Error("Server returned empty response");
          }

          let productData;
          try {
            productData = JSON.parse(responseText);
          } catch (jsonError) {
            console.error("❌ Failed to parse JSON:", jsonError);
            throw new Error(
              `Server returned invalid JSON: ${jsonError.message}`
            );
          }

          // Check if this is a successful product lookup (not a fallback response)
          if (productData && productData.name && productData.supplier !== "Unknown") {
            setProduct(productData);
            setShowQuantitySelector(true);
            await stopScanning();
          } else {
            setError("Product not found. Please try scanning again.");
            lastScannedBarcode.current = "";
          }
        } catch (error) {
          console.error("💥 Error fetching product:", error);

          let errorMessage = "Failed to fetch product information";

          if (error.name === "AbortError") {
            errorMessage = "Request timed out. Please try again.";
          } else if (
            error.name === "TypeError" &&
            error.message.includes("fetch")
          ) {
            errorMessage = "Network error. Check your internet connection.";
          } else {
            errorMessage += `: ${error.message}`;
          }

          setError(errorMessage);
          lastScannedBarcode.current = "";
        } finally {
          setLoading(false);
        }
      }, 500); // 500ms delay to prevent rapid scanning
    },
    [loading, stopScanning]
  );

  const onScanFailure = useCallback((error) => {
    // Handle scan failure, but don't show error for normal scanning
    if (error && error.name !== "NotFoundException") {
      console.error("Scanning error:", error);
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError("");
      lastScannedBarcode.current = "";
      setScannedBarcode("");

      // Create the scanner instance
      html5QrcodeRef.current = new Html5Qrcode("reader");

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();

      if (devices.length === 0) {
        throw new Error("No cameras found on this device");
      }

      // Find back camera (usually has "back" in the label)
      let backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
      );

      // If no back camera found, use the first available camera
      if (!backCamera && devices.length > 0) {
        backCamera = devices[0];
      }

      // Start scanning with the selected camera
      await html5QrcodeRef.current.start(
        { deviceId: backCamera.id },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (error) {
      console.error("💥 Error starting scanner:", error);

      // Only show error if it's a real camera issue
      if (error.name === "NotAllowedError") {
        setError(
          "Camera permission denied. Please allow camera access in your browser settings."
        );
      } else if (error.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else if (error.name === "NotReadableError") {
        setError("Camera is already in use by another application.");
      } else if (error.name === "OverconstrainedError") {
        setError("Camera does not meet the required constraints.");
      }
    }
  }, [onScanSuccess, onScanFailure]);

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
  }, [isOpen, isMobile, startScanning, stopScanning]);

  const handleQuantityConfirm = async () => {
    if (product && quantity > 0) {
      try {
        // First, create or find the product in the database
        // First, create or find the product in the database via shared service
        const productPayload = {
          name: product.name,
          description: product.description || `Product from barcode scan: ${product.name}`,
          unitPrice: parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0,
        };

        const productService = await import("../../services/productService");
        const createdProduct = await productService.createProduct(productPayload);
        if (!createdProduct || !createdProduct.id) {
          throw new Error('Failed to create product');
        }
        
        // Invalidate products query to refresh dropdown
        queryClient.invalidateQueries({ queryKey: ["products"] });

        const unitPriceNumber = parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0;
        // Minimal DTO expected by backend

        // Now create the material data with the database product ID
        const materialData = {
          productId: createdProduct.id,
          quantity: Number(quantity) || 1,
          unitPrice: unitPriceNumber,
          source: "Barcode Scan",
        };

        console.log('Barcode scanner calling onProductFound with:', {
          jobId: jobId,
          material: materialData
        });
        onProductFound({
          jobId: jobId,
          material: materialData
        });
        handleClose();
      } catch (error) {
        console.error('Error creating product:', error);
        setError(`Failed to add to materials: ${error.message}`);
      }
    }
  };

  const handleClose = async () => {
    await stopScanning();
    setProduct(null);
    setQuantity(1);
    setError("");
    setScannedBarcode("");
    lastScannedBarcode.current = "";
    onClose();
  };

   if (!isOpen) return null;

    if (!isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Scan Barcode</h3>
          <Button
            type="text"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-0 h-auto"
            aria-label="Close"
          >
            ×
          </Button>
          </div>

          {/* Message */}
          <div className="text-center text-red-600 text-lg font-medium">
            Barcode scanning is only supported on mobile devices.
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-center">
            <Button
              type="primary"
              onClick={onClose}
              size="large"
              className="bg-gray-800 hover:bg-gray-900 border-gray-800 hover:border-gray-900"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-[90vw] max-h-[90vh] overflow-auto w-[500px] relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="m-0">
            {showQuantitySelector ? "Select Quantity" : "Scan Barcode"}
          </h3>
          <Button
            type="text"
            onClick={handleClose}
            className="text-2xl p-0 h-auto text-gray-500 hover:text-gray-700"
          >
            ×
          </Button>
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
              <h4 className="m-0 mb-2 text-lg">{product.name}</h4>

              <div className="text-sm text-gray-600 mb-2">
                <div>
                  <strong>Price:</strong> {product.price}
                </div>
                {product.category && (
                  <div>
                    <strong>Category:</strong> {product.category}
                  </div>
                )}
                {product.availability && (
                  <div>
                    <strong>Availability:</strong> {product.availability}
                  </div>
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
              <label className="block mb-2 font-bold">Quantity:</label>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  size="large"
                  className="bg-gray-600 hover:bg-gray-700 border-gray-600 hover:border-gray-700"
                >
                  -
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min="1"
                  className="px-2 py-2 border border-gray-300 rounded w-20 text-center text-lg"
                />
                <Button
                  onClick={() => setQuantity(quantity + 1)}
                  size="large"
                  className="bg-gray-600 hover:bg-gray-700 border-gray-600 hover:border-gray-700"
                >
                  +
                </Button>
              </div>

              <div className="mt-2 p-3 bg-green-50 rounded text-center font-bold">
                Total: $
                {(
                  (parseFloat(product.price.replace(/[^0-9.]/g, "")) || 0) *
                  quantity
                ).toFixed(2)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center">
              <Button
                type="primary"
                onClick={handleQuantityConfirm}
                size="large"
                className="bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
              >
                Add to Materials
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
