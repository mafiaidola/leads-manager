�%"use client";

/**
 * Mock Template Gallery - Browse templates by category
 * Phase 10: Template Gallery Page
 */

import { useState } from "react";
import { Language, PropertyType, mockTemplates, MockTemplate } from "./types";

interface MockTemplateGalleryProps {
    language: Language;
    onSelectTemplate: (template: MockTemplate) => void;
    onBack: () => void;
}

const categories: { id: PropertyType | "all"; label: string; labelAr: string }[] = [
    { id: "all", label: "All Templates", labelAr: "جميع القوالب" },
    { id: "store", label: "Stores", labelAr: "متاجر" },
    { id: "website", label: "Websites", labelAr: "مواقع" },
    { id: "funnel", label: "Funnels", labelAr: "صفحات هبوط" },
];

export function MockTemplateGallery({ language, onSelectTemplate, onBack }: MockTemplateGalleryProps) {
    const [activeCategory, setActiveCategory] = useState<PropertyType | "all">("all");
    const isRTL = language === "ar";

    const filteredTemplates = activeCategory === "all" ? mockTemplates : mockTemplates.filter(t => t.type === activeCategory);

    return (
        <div className={`min-h-screen bg-gray-50 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                            <span>{isRTL ? "→" : "←"}</span>
                            <span>{isRTL ? "العودة" : "Back"}</span>
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">{isRTL ? "اختر قالب" : "Choose a Template"}</h1>
                        <div className="w-16" />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                {isRTL ? cat.labelAr : cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Template Grid */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map(template => (
                        <button key={template.id} onClick={() => onSelectTemplate(template)} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden text-left">
                            {/* Thumbnail or Gradient with Emoji */}
                            <div className={`h-40 relative overflow-hidden ${!template.thumbnail ? `bg-gradient-to-br ${template.color}` : ""}`}>
                                {template.thumbnail ? (
                                    <img
                                        src={template.thumbnail}
                                        alt={template.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                                        {template.preview}
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-800">{isRTL ? template.nameAr : template.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{isRTL ? template.descriptionAr : template.description}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-gray-400">{template.sections} {isRTL ? "أقسام" : "sections"}</span>
                                    <span className="text-amber-500 text-sm font-medium">{isRTL ? "اختر ←" : "Select →"}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
�%*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/MockTemplateGallery.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version