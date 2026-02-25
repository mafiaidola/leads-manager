�-"use client";

/**
 * Sidebar Component - Main sidebar with store selector and navigation
 * Refactored: Sub-components in ./sidebar folder
 * ~90 lines - AI friendly
 */

import { useState, useEffect, useCallback } from "react";
import { Property, Language, Theme, translations } from "./types";
import { StoreDropdown } from "./sidebar/StoreDropdown";
import { SidebarMenu } from "./sidebar/SidebarMenu";
import { DashboardTab, menuSections } from "./sidebar/types";

// Re-export for backward compatibility
export type { DashboardTab } from "./sidebar/types";

interface SidebarProps {
    properties: Property[];
    selectedProperty: Property | null;
    onSelectProperty: (property: Property) => void;
    onDeselectProperty: () => void;
    onTabChange: (tab: DashboardTab) => void;
    onCreateNew: () => void;
    activeTab: DashboardTab;
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    language: Language;
    theme: Theme;
}

export function Sidebar({ properties, selectedProperty, onSelectProperty, onDeselectProperty, onTabChange, onCreateNew, activeTab, sidebarOpen, mobileMenuOpen, language }: SidebarProps) {
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const t = translations[language];
    const isRTL = language === "ar";

    // Keyboard navigation - ESC to close dropdown
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape" && storeDropdownOpen) setStoreDropdownOpen(false);
    }, [storeDropdownOpen]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" />}
            {storeDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setStoreDropdownOpen(false)} />}

            <aside className={`fixed top-16 bottom-0 z-50 ${isRTL ? "right-0" : "left-0"} ${isRTL ? "border-l" : "border-r"} transition-all duration-300 ${sidebarOpen ? "w-72" : "w-20"} ${mobileMenuOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="flex flex-col h-full" dir={isRTL ? "rtl" : "ltr"}>
                    {/* Store Selector */}
                    <div className="relative p-4 flex-shrink-0">
                        <button onClick={() => setStoreDropdownOpen(!storeDropdownOpen)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isRTL ? "flex-row-reverse" : ""} ${selectedProperty ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-400 shadow-sm" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"} hover:shadow-md`}>
                            {selectedProperty && <div className={`absolute ${isRTL ? "right-0" : "left-0"} top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-full`} />}
                            <span className="text-2xl">{selectedProperty?.emoji || "🏰"}</span>
                            {sidebarOpen && (
                                <>
                                    <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{selectedProperty ? (isRTL ? selectedProperty.nameAr : selectedProperty.name) : t.myEmpire}</p>
                                        <p className="text-xs text-gray-500">{selectedProperty ? (language === "ar" ? "انقر للتبديل" : "Click to switch") : (language === "ar" ? "اختر متجراً" : "Select a store")}</p>
                                    </div>
                                    <span className={`text-gray-400 transition-transform duration-200 ${storeDropdownOpen ? "rotate-180" : ""}`}>▼</span>
                                </>
                            )}
                        </button>
                        {!sidebarOpen && selectedProperty && (
                            <div className="mt-2 text-center">
                                <div className="w-2 h-2 bg-amber-500 rounded-full mx-auto animate-pulse" title={isRTL ? selectedProperty.nameAr : selectedProperty.name} />
                            </div>
                        )}
                        {sidebarOpen && <StoreDropdown properties={properties} selectedProperty={selectedProperty} onSelectProperty={onSelectProperty} onViewAllStores={onDeselectProperty} onCreateNew={onCreateNew} isOpen={storeDropdownOpen} onClose={() => setStoreDropdownOpen(false)} language={language} />}
                    </div>

                    {/* Menu Items */}
                    {selectedProperty && sidebarOpen && <SidebarMenu sections={menuSections} activeTab={activeTab} onTabChange={onTabChange} language={language} />}

                    {/* Empty State */}
                    {!selectedProperty && sidebarOpen && (
                        <div className="flex-1 flex items-center justify-center text-gray-400 px-4">
                            <div className="text-center">
                                <p className="text-5xl mb-4">🏰</p>
                                <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">{language === "ar" ? "مرحباً بإمبراطوريتك!" : "Welcome to Your Empire!"}</p>
                                <p className="text-sm">{language === "ar" ? "اختر متجراً للبدء" : "Select a store above to start"}</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
�-*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/Sidebar.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version