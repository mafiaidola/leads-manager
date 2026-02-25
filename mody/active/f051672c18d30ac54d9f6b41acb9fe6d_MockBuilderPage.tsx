�)"use client";

/**
 * Mock Builder Page - Simplified builder preview experience
 * Phase 7: Mock Builder + Phase 8: Publish Flow
 */

import { useState } from "react";
import { Language, PropertyType, MockTemplate } from "./types";
import { MockCanvas } from "./MockCanvas";
import { MockToolbar } from "./MockToolbar";
import { PublishModal } from "./PublishModal";
import { PublishSuccessModal } from "./PublishSuccessModal";

interface MockBuilderPageProps {
    language: Language;
    propertyName: string;
    propertyType: PropertyType;
    template: MockTemplate | null;
    propertyUrl?: string;
    onBack: () => void;
    onPublish: () => void;
}

const colorThemes = [
    { id: "amber", name: "Amber", colors: "from-amber-500 to-orange-500" },
    { id: "blue", name: "Blue", colors: "from-blue-500 to-indigo-500" },
    { id: "green", name: "Green", colors: "from-green-500 to-teal-500" },
    { id: "purple", name: "Purple", colors: "from-purple-500 to-pink-500" },
    { id: "rose", name: "Rose", colors: "from-rose-500 to-red-500" },
];

export function MockBuilderPage({ language, propertyName, propertyType, template, propertyUrl, onBack, onPublish }: MockBuilderPageProps) {
    const [selectedTheme, setSelectedTheme] = useState(colorThemes[0]);
    const [sections, setSections] = useState(() => generateSections(template));
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const isRTL = language === "ar";

    const handleMoveSection = (index: number, direction: "up" | "down") => {
        const newSections = [...sections];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setSections(newSections);
    };

    const handlePublishConfirm = () => {
        setShowPublishModal(false);
        setShowSuccessModal(true);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        onPublish();
    };

    const url = propertyUrl || `${propertyName.toLowerCase().replace(/\s/g, "-")}.egybag.com`;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <MockToolbar language={language} onBack={onBack} onPublish={() => setShowPublishModal(true)} colorThemes={colorThemes} selectedTheme={selectedTheme} onSelectTheme={setSelectedTheme} />

            <div className="flex-1 p-6 overflow-auto">
                <div className={`mb-4 flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={isRTL ? "text-right" : ""}>
                        <h1 className="text-xl font-bold text-gray-800">{propertyName}</h1>
                        <p className="text-sm text-gray-500">{isRTL ? "وضع التحرير" : "Editing Mode"}</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">{propertyType}</span>
                </div>
                <MockCanvas sections={sections} theme={selectedTheme} onMoveSection={handleMoveSection} language={language} propertyType={propertyType} />
            </div>

            {/* Publish Modals */}
            <PublishModal isOpen={showPublishModal} onClose={() => setShowPublishModal(false)} onConfirm={handlePublishConfirm} propertyName={propertyName} propertyUrl={url} language={language} />
            <PublishSuccessModal isOpen={showSuccessModal} onClose={handleSuccessClose} propertyName={propertyName} propertyUrl={url} language={language} />
        </div>
    );
}

function generateSections(template: MockTemplate | null): { id: string; name: string; nameAr: string; icon: string }[] {
    if (!template) return [{ id: "1", name: "Hero", nameAr: "البطل", icon: "🎯" }];
    const sectionTypes: Record<PropertyType, { id: string; name: string; nameAr: string; icon: string }[]> = {
        store: [
            { id: "1", name: "Hero Banner", nameAr: "بانر رئيسي", icon: "🎯" },
            { id: "2", name: "Featured Products", nameAr: "منتجات مميزة", icon: "🛍️" },
            { id: "3", name: "Categories", nameAr: "الفئات", icon: "📦" },
            { id: "4", name: "Testimonials", nameAr: "آراء العملاء", icon: "⭐" },
            { id: "5", name: "Footer", nameAr: "تذييل", icon: "📌" },
        ],
        website: [
            { id: "1", name: "Hero Section", nameAr: "القسم الرئيسي", icon: "🎯" },
            { id: "2", name: "About", nameAr: "عن", icon: "👤" },
            { id: "3", name: "Projects", nameAr: "المشاريع", icon: "💼" },
            { id: "4", name: "Contact", nameAr: "اتصل بنا", icon: "📧" },
        ],
        funnel: [
            { id: "1", name: "Hero + CTA", nameAr: "رئيسي + دعوة", icon: "🎯" },
            { id: "2", name: "Benefits", nameAr: "المزايا", icon: "✨" },
            { id: "3", name: "Final CTA", nameAr: "دعوة نهائية", icon: "🚀" },
        ],
    };
    return sectionTypes[template.type] || sectionTypes.store;
}
�)"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/MockBuilderPage.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version