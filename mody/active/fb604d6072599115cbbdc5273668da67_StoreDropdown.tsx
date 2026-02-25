Õ"use client";

/**
 * StoreDropdown - Overlay dropdown for store selection
 * Extracted from Sidebar.tsx
 * ~60 lines - AI friendly
 */

import { Property, Language, translations } from "../types";

interface StoreDropdownProps {
    properties: Property[];
    selectedProperty: Property | null;
    onSelectProperty: (property: Property) => void;
    onViewAllStores: () => void;
    onCreateNew: () => void;
    isOpen: boolean;
    onClose: () => void;
    language: Language;
}

export function StoreDropdown({ properties, selectedProperty, onSelectProperty, onViewAllStores, onCreateNew, isOpen, onClose, language }: StoreDropdownProps) {
    const t = translations[language];
    const isRTL = language === "ar";

    if (!isOpen) return null;

    const handleSelect = (prop: Property) => {
        onSelectProperty(prop);
        onClose();
    };

    return (
        <div className="absolute left-4 right-4 top-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl animate-fadeIn z-50 max-h-64 overflow-y-auto">
            {/* View All Stores button - shows when a store is selected */}
            {selectedProperty && (
                <button onClick={() => { onViewAllStores(); onClose(); }} className={`w-full flex items-center gap-2 p-2.5 mb-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-blue-50/50 dark:bg-blue-900/10 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <span className="text-lg">üè†</span>
                    <span className="font-medium text-sm">{language === "ar" ? "ÿπÿ±ÿ∂ ÿ¨ŸÖŸäÿπ ÿßŸÑŸÖÿ™ÿßÿ¨ÿ±" : "View All Stores"}</span>
                </button>
            )}
            <p className="text-xs text-gray-400 uppercase tracking-wider px-2 py-1 font-medium">üè∞ {t.myEmpire}</p>
            <div className="space-y-1 mt-1">
                {properties.map((prop) => (
                    <button key={prop.id} onClick={() => handleSelect(prop)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${isRTL ? "flex-row-reverse text-right" : ""} ${selectedProperty?.id === prop.id ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-l-4 border-amber-500" : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>
                        <span className="text-xl">{prop.emoji}</span>
                        <span className="flex-1 font-medium text-sm truncate">{isRTL ? prop.nameAr : prop.name}</span>
                        {prop.isLive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                        {selectedProperty?.id === prop.id && <span className="text-amber-600 font-bold">‚úì</span>}
                    </button>
                ))}
            </div>
            <button onClick={onCreateNew} className={`w-full flex items-center gap-2 p-2.5 mt-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-dashed border-amber-300 dark:border-amber-700 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-lg">‚ûï</span>
                <span className="font-medium text-sm">{t.createNew}</span>
            </button>
        </div>
    );
}
∂ *cascade08∂«*cascade08«≤ *cascade08≤Ø*cascade08ØÕ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72†file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/sidebar/StoreDropdown.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version