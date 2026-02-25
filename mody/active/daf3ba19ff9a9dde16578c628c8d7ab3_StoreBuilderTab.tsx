�5"use client";

/**
 * StoreBuilder Tab - Builder preview and page management
 * Phase 2: Store Management
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Language, translations } from "./types";

interface StoreBuilderTabProps { language: Language; storeId?: string; }

const mockPages = [
    { id: "home", name: "Home", nameAr: "الرئيسية", icon: "🏠", sections: 5 },
    { id: "products", name: "Products", nameAr: "المنتجات", icon: "📦", sections: 3 },
    { id: "about", name: "About Us", nameAr: "عنا", icon: "ℹ️", sections: 4 },
    { id: "contact", name: "Contact", nameAr: "اتصل بنا", icon: "📞", sections: 2 },
    { id: "faq", name: "FAQ", nameAr: "الأسئلة", icon: "❓", sections: 3 },
];

export function StoreBuilderTab({ language, storeId }: StoreBuilderTabProps) {
    const router = useRouter();
    const [selectedPage, setSelectedPage] = useState("home");
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const isRTL = language === "ar";
    const t = translations[language];

    const openBuilder = () => router.push(`/newlayout1/preview/builder${storeId ? `?storeId=${storeId}` : ""}`);

    const currentPage = mockPages.find(p => p.id === selectedPage) || mockPages[0];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className={`flex items-center justify-between flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {isRTL ? "منشئ المتجر" : "Store Builder"}
                </h2>
                <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl font-medium text-sm" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-primary)" }}>
                        🔙 {isRTL ? "تراجع" : "Undo"}
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm shadow-md">
                        💾 {isRTL ? "حفظ" : "Save"}
                    </button>
                </div>
            </div>

            {/* Page Selector + Preview Mode */}
            <div className={`flex flex-wrap items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <select value={selectedPage} onChange={e => setSelectedPage(e.target.value)} className="px-4 py-2.5 rounded-xl border font-medium" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                    {mockPages.map(p => <option key={p.id} value={p.id}>{p.icon} {isRTL ? p.nameAr : p.name}</option>)}
                </select>
                <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <button onClick={() => setPreviewMode("desktop")} className={`px-4 py-2 text-sm ${previewMode === "desktop" ? "bg-amber-500 text-white" : ""}`} style={previewMode !== "desktop" ? { backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)" } : {}}>🖥️ Desktop</button>
                    <button onClick={() => setPreviewMode("mobile")} className={`px-4 py-2 text-sm ${previewMode === "mobile" ? "bg-amber-500 text-white" : ""}`} style={previewMode !== "mobile" ? { backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)" } : {}}>📱 Mobile</button>
                </div>
                <button onClick={openBuilder} className="px-4 py-2 rounded-xl border font-medium text-sm" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                    🔗 {isRTL ? "فتح المحرر الكامل" : "Open Full Editor"}
                </button>
            </div>

            {/* Page Info */}
            <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border)" }}>
                <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <span className="text-3xl">{currentPage.icon}</span>
                    <div className={isRTL ? "text-right" : ""}>
                        <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>{isRTL ? currentPage.nameAr : currentPage.name}</h3>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{currentPage.sections} {isRTL ? "أقسام" : "sections"}</p>
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className={`rounded-2xl border overflow-hidden ${previewMode === "mobile" ? "max-w-sm mx-auto" : ""}`} style={{ backgroundColor: "#f8fafc", borderColor: "var(--border)" }}>
                <div className="bg-gray-800 text-white text-xs px-4 py-2 flex items-center justify-between">
                    <span>📄 {currentPage.id === "home" ? "/" : `/${currentPage.id}`}</span>
                    <span>{previewMode === "desktop" ? "1280×800" : "375×812"}</span>
                </div>
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center p-8">
                        <span className="text-6xl block mb-4">{currentPage.icon}</span>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">{isRTL ? currentPage.nameAr : currentPage.name} {isRTL ? "معاينة" : "Preview"}</h3>
                        <p className="text-gray-500 mb-4">{isRTL ? "اضغط لتعديل الأقسام" : "Click to edit sections"}</p>
                        <button onClick={openBuilder} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all">
                            ✏️ {isRTL ? "تحرير الصفحة" : "Edit Page"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Add Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Hero", "Products", "About", "Contact"].map(section => (
                    <button key={section} className="p-4 rounded-xl border-2 border-dashed text-center hover:border-amber-400 hover:bg-amber-50/50 transition-all" style={{ borderColor: "var(--border)" }}>
                        <span className="block text-2xl mb-1">{section === "Hero" ? "🖼️" : section === "Products" ? "📦" : section === "About" ? "ℹ️" : "📞"}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>+ {section}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
� ��*cascade08
�� ��*cascade08
�� ��*cascade08
�� ��*cascade08
�� ��	*cascade08
�	� ��*cascade08
��- �-�-*cascade08
�-�5 "(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/StoreBuilderTab.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version