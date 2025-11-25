import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs uppercase tracking-widest text-gray-dark mb-2">
                    {label}
                </label>
            )}
            <input
                className={`w-full py-4 px-4 bg-white border border-gray-mid text-black text-sm placeholder:text-gray-dark focus:outline-none focus:border-black transition-colors duration-300 rounded-none ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};
