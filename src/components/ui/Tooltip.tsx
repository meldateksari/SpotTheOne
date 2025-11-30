import React, { ReactNode, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: string;
    children: ReactNode;
    className?: string;
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 8, // Slightly above
        });
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    if (!mounted) return <div className={className}>{children}</div>;

    return (
        <>
            <div
                className={className}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            {isVisible &&
                createPortal(
                    <div
                        className="fixed z-[9999] px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-nowrap animate-[fadeIn_0.2s_ease-out_forwards]"
                        style={{ left: position.x, top: position.y }}
                    >
                        {content}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>,
                    document.body
                )}
        </>
    );
}
