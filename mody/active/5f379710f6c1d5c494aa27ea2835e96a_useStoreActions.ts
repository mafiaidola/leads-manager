� "use client";

/**
 * Store Actions - CRUD operations for stores
 * Split from usePropertyHandlers.ts for file size compliance
 * ~70 lines
 */

import { toast } from "sonner";
import { Property, Language } from "./types";

export interface StoreActionsConfig {
    properties: Property[];
    setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
    archivedProperties: Property[];
    setArchivedProperties: React.Dispatch<React.SetStateAction<Property[]>>;
    language: Language;
}

export function createStoreActions(config: StoreActionsConfig) {
    const { properties, setProperties, archivedProperties, setArchivedProperties, language } = config;

    // Archive store (soft delete)
    const handleArchiveStore = async (id: string) => {
        try {
            const res = await fetch(`/api/stores/${id}`, { method: "DELETE" });
            if (res.ok) {
                const archived = properties.find(p => p.id === id);
                if (archived) setArchivedProperties(prev => [...prev, archived]);
                setProperties(prev => prev.filter(p => p.id !== id));
                toast.success(language === "ar" ? "📦 تم أرشفة المتجر" : "📦 Store archived");
            } else { toast.error("Failed to archive store"); }
        } catch { toast.error("Failed to archive store"); }
    };

    // Restore archived store
    const handleRestoreStore = async (id: string) => {
        try {
            const res = await fetch(`/api/stores/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) });
            if (res.ok) {
                const restored = archivedProperties.find(p => p.id === id);
                if (restored) setProperties(prev => [restored, ...prev]);
                setArchivedProperties(prev => prev.filter(p => p.id !== id));
                toast.success(language === "ar" ? "♻️ تم استعادة المتجر" : "♻️ Store restored");
            } else { toast.error("Failed to restore store"); }
        } catch { toast.error("Failed to restore store"); }
    };

    // Hard delete (permanent)
    const handleHardDeleteStore = async (id: string) => {
        try {
            const res = await fetch(`/api/stores/${id}?hard=true`, { method: "DELETE" });
            if (res.ok) {
                setArchivedProperties(prev => prev.filter(p => p.id !== id));
                toast.success(language === "ar" ? "🗑️ تم الحذف نهائياً" : "🗑️ Permanently deleted");
            } else { toast.error("Delete failed"); }
        } catch { toast.error("Delete failed"); }
    };

    // Edit store
    const handleEditStore = async (id: string, data: { name: string; nameAr: string }) => {
        try {
            const res = await fetch(`/api/stores/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.name, name_ar: data.nameAr }) });
            if (res.ok) {
                setProperties(prev => prev.map(p => p.id === id ? { ...p, name: data.name, nameAr: data.nameAr } : p));
                toast.success(language === "ar" ? "✅ تم التحديث" : "✅ Store updated");
            } else { toast.error("Update failed"); }
        } catch { toast.error("Update failed"); }
    };

    // Duplicate store
    const handleDuplicateStore = async (property: Property) => {
        const name = `${property.name} (Copy)`;
        const subdomain = `${property.url.split(".")[0]}-copy-${Date.now()}`;
        try {
            const res = await fetch("/api/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, subdomain, type: property.type }) });
            const json = await res.json();
            if (json.success) {
                toast.success(language === "ar" ? "📋 تم النسخ" : "📋 Store duplicated");
            } else { toast.error("Duplicate failed"); }
        } catch { toast.error("Duplicate failed"); }
    };

    return { handleArchiveStore, handleRestoreStore, handleHardDeleteStore, handleEditStore, handleDuplicateStore };
}
� *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/useStoreActions.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version