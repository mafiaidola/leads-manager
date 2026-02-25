‚"use client";

/**
 * ThemedButton - Button component that uses theme colors
 * Uses CSS variables from ThemeContext
 * ~45 lines - AI friendly
 */

import { ReactNode } from "react";

interface ThemedButtonProps {
    children: ReactNode;
    variant?: "primary" | "secondary" | "accent" | "outline";
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export function ThemedButton({
    children,
    variant = "primary",
    size = "md",
    onClick,
    className = "",
    disabled = false,
    type = "button",
}: ThemedButtonProps) {
    const sizeClasses = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: { backgroundColor: "var(--theme-primary)", color: "#ffffff" },
        secondary: { backgroundColor: "var(--theme-secondary)", color: "#ffffff" },
        accent: { backgroundColor: "var(--theme-accent)", color: "#ffffff" },
        outline: { backgroundColor: "transparent", border: "2px solid var(--theme-primary)", color: "var(--theme-primary)" },
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`font-bold tracking-wider transition-all hover:opacity-90 disabled:opacity-50 ${sizeClasses[size]} ${className}`}
            style={{
                ...variantStyles[variant],
                borderRadius: "var(--theme-border-radius)",
            }}
        >
            {children}
        </button>
    );
}
‚*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72Ÿfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/ThemedButton.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version