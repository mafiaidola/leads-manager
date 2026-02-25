�"use client";

/**
 * Dashboard Context - Shares state between layout, sidebar, and page
 * Enables: store selection sync, tab navigation, API connection
 * ~50 lines - AI friendly
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Property, Language, Theme, PropertyType } from "./types";
import { DashboardTab } from "./Sidebar";

interface DashboardContextType {
    // Stores
    stores: Property[];
    selectedStore: Property | null;
    setSelectedStore: (store: Property | null) => void;
    isLoading: boolean;
    refetchStores: () => void;

    // Navigation
    activeTab: DashboardTab;
    setActiveTab: (tab: DashboardTab) => void;

    // UI
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
    return ctx;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [stores, setStores] = useState<Property[]>([]);
    const [selectedStore, setSelectedStore] = useState<Property | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
    const [language, setLanguage] = useState<Language>("en");
    const [theme, setTheme] = useState<Theme>("light");

    const fetchStores = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/stores");
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                const apiStores: Property[] = json.data.map((s: { id: string; name: string; subdomain: string }) => ({
                    id: s.id,
                    name: s.name || "My Store",
                    nameAr: s.name || "متجري",
                    url: `${s.subdomain}.egybag.com`,
                    emoji: "🏪",
                    type: "store" as PropertyType,
                    isLive: true,
                }));
                setStores(apiStores);
            }
        } catch { console.error("Failed to load stores"); }
        setIsLoading(false);
    };

    useEffect(() => { fetchStores(); }, []);

    return (
        <DashboardContext.Provider value={{
            stores, selectedStore, setSelectedStore, isLoading, refetchStores: fetchStores,
            activeTab, setActiveTab, language, setLanguage, theme, setTheme,
        }}>
            {children}
        </DashboardContext.Provider>
    );
}
�*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/DashboardContext.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version