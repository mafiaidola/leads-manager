£"use client";

/**
 * HeroButtons - Hero section button and color picker components
 * Split from TemplateHero for AI-friendly file size
 * Uses theme CSS variables with fallback to explicit colors
 * ~65 lines
 */

import { EditableElement } from "./EditableElement";

interface HeroButtonsProps {
    buttonText: string;
    secondaryButtonText: string;
    buttonColor: string;
    selectedColor: string;
    colorOptions: string[];
    isBuilderMode: boolean;
    isMobilePreview: boolean;
    onAddToCart: () => void;
    onBuyNow: () => void;
    onButtonTextChange?: (value: string) => void;
    onSecondaryButtonTextChange?: (value: string) => void;
    onColorSelect?: (color: string) => void;
}

export function HeroButtons({
    buttonText, secondaryButtonText, buttonColor, selectedColor, colorOptions,
    isBuilderMode, isMobilePreview, onAddToCart, onBuyNow,
    onButtonTextChange, onSecondaryButtonTextChange, onColorSelect,
}: HeroButtonsProps) {
    // Use explicit buttonColor if provided, otherwise fall back to theme variable
    const primaryBtnStyle: React.CSSProperties = {
        backgroundColor: buttonColor || "var(--theme-primary, #E53935)",
        borderRadius: "var(--theme-border-radius, 0px)",
    };

    const secondaryBtnStyle: React.CSSProperties = {
        borderRadius: "var(--theme-border-radius, 0px)",
    };

    return (
        <>
            <div className={`flex gap-4 mb-8 ${isMobilePreview ? 'justify-center flex-col sm:flex-row' : 'justify-center md:justify-start'}`}>
                {/* Secondary Button (Add to Cart) */}
                <EditableElement elementId="hero-addtocart" elementType="button" value={secondaryButtonText} onValueChange={onSecondaryButtonTextChange}>
                    <button onClick={onAddToCart} className={`px-8 py-3 border-2 border-gray-400 text-white font-bold tracking-wider hover:bg-white hover:text-black transition-colors ${isBuilderMode ? "cursor-default" : ""}`} style={secondaryBtnStyle}>
                        {secondaryButtonText}
                    </button>
                </EditableElement>

                {/* Primary Button (Buy Now) */}
                <EditableElement elementId="hero-buynow" elementType="button" value={buttonText} onValueChange={onButtonTextChange}>
                    <button onClick={onBuyNow} className={`px-8 py-3 text-white font-bold tracking-wider hover:opacity-90 transition-colors ${isBuilderMode ? "cursor-default" : ""}`} style={primaryBtnStyle}>
                        {buttonText}
                    </button>
                </EditableElement>
            </div>

            {/* Color Options */}
            <div className={`flex gap-3 ${isMobilePreview ? 'justify-center' : 'justify-center md:justify-start'}`}>
                {colorOptions.map((color, idx) => (
                    <button
                        key={idx}
                        onClick={() => onColorSelect?.(color)}
                        className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? "border-red-500 ring-2 ring-red-300" : "border-transparent"} ${isBuilderMode ? "cursor-pointer" : "hover:scale-110"} transition-transform`}
                        style={{ backgroundColor: color }}
                        title={`Select ${color}`}
                    />
                ))}
            </div>
        </>
    );
}

Œ *cascade08ŒÉ*cascade08ÉË *cascade08ËÌ*cascade08ÌÅ *cascade08ÅË
*cascade08Ë
¤ *cascade08¤¾*cascade08¾¤ *cascade08¤¨*cascade08¨ª *cascade08ª­*cascade08­® *cascade08®¯*cascade08¯° *cascade08°±*cascade08±² *cascade08²³*cascade08³¢ *cascade08¢£*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72žfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/HeroButtons.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version