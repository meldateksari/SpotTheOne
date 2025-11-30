import React from "react";

interface AlertModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onClose: () => void;
    buttonText?: string;
}

export default function AlertModal({
    isOpen,
    title,
    message,
    onClose,
    buttonText = "OK",
}: AlertModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 fade-in">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-scale-in">
                {/* Header */}
                {title && (
                    <div className="bg-black text-white p-6 text-center">
                        <h2 className="text-xl font-bold uppercase tracking-widest">
                            {title}
                        </h2>
                    </div>
                )}

                {/* Content */}
                <div className="p-8 text-center space-y-4">
                    <div className="flex justify-center mb-4">
                        <span className="material-symbols-outlined text-5xl text-black">
                            error
                        </span>
                    </div>
                    <p className="text-gray-800 font-medium uppercase tracking-wide">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors w-full"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
