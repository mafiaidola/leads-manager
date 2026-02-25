æ"use client";

/**
 * ProductGridHeader - Title with EditableElement and Add Product button
 * ~45 lines - AI friendly
 */

import { EditableElement } from "../EditableElement";

interface ProductGridHeaderProps {
    title: string;
    isBuilderMode: boolean;
    onAddProduct: () => void;
    onTitleChange?: (value: string) => void;
}

export function ProductGridHeader({ title, isBuilderMode, onAddProduct, onTitleChange }: ProductGridHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8">
            <EditableElement elementId="products-title" elementType="heading" value={title} onValueChange={onTitleChange}>
                <h2 className="text-3xl font-bold text-white">{title}</h2>
            </EditableElement>
            {isBuilderMode && (
                <div className="flex items-center gap-2">
                    <span
                        className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-dashed border-gray-600"
                        title="This button is only visible in the editor"
                    >
                        ðŸ”§ Editor Only
                    </span>
                    <button
                        onClick={onAddProduct}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                    >
                        + Add Product
                    </button>
                </div>
            )}
        </div>
    );
}
0 *cascade080E*cascade08E` *cascade08`b*cascade08b} *cascade08}´*cascade08´£ *cascade08£Ð*cascade08Ð™ *cascade08™¨*cascade08¨¡ *cascade08¡ *cascade08 Ø *cascade08Ø÷*cascade08÷æ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¸file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/TemplateProductGrid/ProductGridHeader.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version