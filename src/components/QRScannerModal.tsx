"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useLanguage } from "@/context/LanguageContext";

interface QRScannerModalProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function QRScannerModal({ onScan, onClose }: QRScannerModalProps) {
    const { t } = useLanguage();
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        const readerId = "qr-reader-custom";

        const startScanner = async () => {
            try {
                // Initialize scanner
                const html5QrCode = new Html5Qrcode(readerId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (mountedRef.current) {
                            onScan(decodedText);
                        }
                    },
                    (errorMessage) => {
                        // Ignore parse errors, they happen when no QR is in view
                    }
                );
            } catch (err) {
                console.error("Error starting scanner:", err);
                if (mountedRef.current) {
                    setError(t("cameraError") || "Could not access camera. Please ensure permissions are granted.");
                }
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(startScanner, 100);

        return () => {
            mountedRef.current = false;
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(console.error);
            }
        };
    }, [onScan, t]);

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 fade-in">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
            >
                <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            <div className="w-full max-w-md flex flex-col items-center space-y-8 relative">

                <div className="text-center space-y-2 text-white z-10">
                    <h2 className="text-xl font-bold uppercase tracking-widest">{t("scanQr")}</h2>
                    <p className="text-xs uppercase tracking-widest opacity-70">
                        {t("scanQrDesc") || "Align QR code within the frame"}
                    </p>
                </div>

                {/* Scanner Container */}
                <div className="relative w-[300px] h-[300px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">

                    {/* The actual video element */}
                    <div id="qr-reader-custom" className="w-full h-full object-cover"></div>

                    {/* Error Message */}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
                            <p className="text-red-500 text-sm font-bold uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    {/* Overlay UI */}
                    {!error && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Corner Markers */}
                            <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                            <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>

                            {/* Scanning Line Animation */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50 animate-[scan_2s_linear_infinite]"></div>
                        </div>
                    )}
                </div>

                <p className="text-white/50 text-[10px] uppercase tracking-widest">
                    Spot The One
                </p>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(24px); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(276px); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
