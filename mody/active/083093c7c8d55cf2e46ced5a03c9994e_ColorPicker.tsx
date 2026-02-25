Î"use client";

/**
 * Color Picker - Simple color selector component
 * Phase 15: Enhanced Editing
 */

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    colors?: string[];
    label?: string;
}

const defaultColors = [
    "#E53935", // Red
    "#D81B60", // Pink
    "#8E24AA", // Purple
    "#5E35B1", // Deep Purple
    "#3949AB", // Indigo
    "#1E88E5", // Blue
    "#039BE5", // Light Blue
    "#00ACC1", // Cyan
    "#00897B", // Teal
    "#43A047", // Green
    "#7CB342", // Light Green
    "#FDD835", // Yellow
    "#FFB300", // Amber
    "#FB8C00", // Orange
    "#F4511E", // Deep Orange
    "#1a1a1a", // Black
];

export function ColorPicker({ value, onChange, colors = defaultColors, label }: ColorPickerProps) {
    return (
        <div>
            {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
            <div className="grid grid-cols-8 gap-2">
                {colors.map(color => (
                    <button
                        key={color}
                        onClick={() => onChange(color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${value === color ? "border-gray-800 ring-2 ring-offset-1 ring-gray-400" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs text-gray-500">Custom color</span>
            </div>
        </div>
    );
}
Î"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¦file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/ColorPicker.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version