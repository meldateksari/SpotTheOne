import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hoverEffect = true
}) => {
    return (
        <div className={`bg-white border border-gray-mid p-8 transition-all duration-300 ${hoverEffect ? 'hover:border-black' : ''} ${className}`}>
            {children}
        </div>
    );
};
