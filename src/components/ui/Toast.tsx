import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isVisible) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldRender(true);
            // Trigger animation in next tick
            requestAnimationFrame(() => setShow(true));

            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, duration);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!mounted || !shouldRender) return null;

    return createPortal(
        <div
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ease-in-out pointer-events-none ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                }`}
        >
            <div className="bg-black text-white px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-800 pointer-events-auto max-w-[90vw] whitespace-nowrap">
                <span className="material-symbols-outlined text-green-400">check_circle</span>
                <span className="text-sm font-bold uppercase tracking-widest">{message}</span>
            </div>
        </div>,
        document.body
    );
}
