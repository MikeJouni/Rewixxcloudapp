import React, { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

const BarcodeScannerModal = ({ onDetected, onClose }) => {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let isMounted = true;
    codeReader.decodeFromVideoDevice(
      null,
      videoRef.current,
      (result, err) => {
        if (result) {
          onDetected(result.getText());
          if (controlsRef.current) controlsRef.current.stop();
        }
      }
    ).then((controls) => {
      if (isMounted) controlsRef.current = controls;
    });

    return () => {
      isMounted = false;
      if (controlsRef.current) controlsRef.current.stop();
    };
    // eslint-disable-next-line
  }, [onDetected]);

  return (
    <div className="modal" style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex",
      alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 8, textAlign: "center" }}>
        <h3>Scan Material Barcode</h3>
        <video ref={videoRef} style={{ width: 300, height: 300 }} />
        <button onClick={onClose} style={{ marginTop: 16 }}>Cancel</button>
      </div>
    </div>
  );
};

export default BarcodeScannerModal; 