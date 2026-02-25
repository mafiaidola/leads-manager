í6"use client";

/**
 * Multi-Step Onboarding - Store Creation with Template Selection
 * Step 1: Store Name â†’ Step 2: Template â†’ Step 3: Creating...
 * 
 * Constants extracted to: ./onboardingConstants.ts
 */

import { useState } from "react";
import { Language, PropertyType } from "./types";
import { toast } from "sonner";
import { starterTemplates, generateSubdomain, getErrorMessage } from "./onboardingConstants";

interface MockOnboardingPageProps {
    language: Language;
    onComplete: (type: PropertyType, name: string, templateId?: string) => void;
    onSkip: () => void;
}

export function MockOnboardingPage({ language, onComplete, onSkip }: MockOnboardingPageProps) {
    const [step, setStep] = useState(1);
    const [businessName, setBusinessName] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const isRTL = language === "ar";

    const handleCreateStore = async () => {
        if (!businessName.trim()) return;
        setLoading(true);

        const subdomain = generateSubdomain(businessName);

        try {
            const res = await fetch("/api/stores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                // NOTE: Don't send template_id - it's a FK requiring UUID from store_templates table
                // Starter templates (fashion, electronics) are styling hints, not DB references
                // We send category instead for future styling defaults
                body: JSON.stringify({
                    name: businessName,
                    subdomain,
                    category: selectedTemplate, // "fashion", "electronics" etc as category
                    // template_id: null - omit entirely to avoid FK constraint
                }),
            });
            const json = await res.json();

            if (json.success && json.store) {
                onComplete("store", businessName, selectedTemplate || undefined);
            } else {
                toast.error(getErrorMessage(json.error || "Unknown error", isRTL));
            }
        } catch {
            toast.error(isRTL ? "Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„" : "Connection error. Check your internet.");
        }
        setLoading(false);
    };

    const previewUrl = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "your-store";

    return (
        <div className={isRTL ? "text-right" : ""} dir={isRTL ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-4xl">ğŸ›’</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {isRTL ? "Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ÙÙŠ Ø¥ÙŠØ¬ÙŠ Ø¨Ø§Ø¬!" : "Welcome to Egybag!"}
                </h2>
                <p className="text-gray-500">
                    {step === 1 && (isRTL ? "Ø§Ù„Ø®Ø·ÙˆØ© 1: Ø§Ø®ØªØ± Ø§Ø³Ù… Ù…ØªØ¬Ø±Ùƒ" : "Step 1: Name your store")}
                    {step === 2 && (isRTL ? "Ø§Ù„Ø®Ø·ÙˆØ© 2: Ø§Ø®ØªØ± Ø§Ù„Ù‚Ø§Ù„Ø¨" : "Step 2: Pick a template")}
                </p>
            </div>

            {/* Progress */}
            <div className="flex gap-2 mb-6">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-blue-500" : "bg-gray-200"}`} />
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-blue-500" : "bg-gray-200"}`} />
            </div>

            {/* Step 1: Store Name */}
            {step === 1 && (
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isRTL ? "Ø§Ø³Ù… Ø§Ù„Ù…ØªØ¬Ø±" : "Store Name"}
                        </label>
                        <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={isRTL ? "Ù…Ø«Ø§Ù„: Ù…ØªØ¬Ø± Ø§Ù„Ø£Ø²ÙŠØ§Ø¡" : "e.g. Fashion Store"} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" autoFocus />
                        <p className="text-xs text-gray-400 mt-2">
                            {isRTL ? "Ø±Ø§Ø¨Ø· Ù…ØªØ¬Ø±Ùƒ: " : "Your URL: "}
                            <span className="text-blue-600">{previewUrl}.egybag.com</span>
                        </p>
                    </div>
                    <button onClick={() => businessName.trim() && setStep(2)} disabled={!businessName.trim()} className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50">
                        {isRTL ? "Ø§Ù„ØªØ§Ù„ÙŠ â†’" : "Next â†’"}
                    </button>
                </div>
            )}

            {/* Step 2: Template Selection */}
            {step === 2 && (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        {starterTemplates.map((t) => (
                            <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`p-4 rounded-xl border-2 transition-all text-left ${selectedTemplate === t.id ? "border-blue-500 bg-blue-50 shadow-lg scale-105" : "border-gray-200 hover:border-blue-300"}`}>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-2`}>
                                    <span className="text-2xl">{t.emoji}</span>
                                </div>
                                <p className="font-medium text-gray-800">{isRTL ? t.nameAr : t.name}</p>
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600">
                            {isRTL ? "â† Ø±Ø¬ÙˆØ¹" : "â† Back"}
                        </button>
                        <button onClick={handleCreateStore} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-70">
                            {loading ? (isRTL ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡..." : "Creating...") : (isRTL ? "ğŸš€ Ø¥Ù†Ø´Ø§Ø¡ Ù…ØªØ¬Ø±ÙŠ" : "ğŸš€ Create Store")}
                        </button>
                    </div>
                </div>
            )}

            <button onClick={onSkip} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm">
                {isRTL ? "ØªØ®Ø·ÙŠ Ø§Ù„Ø¢Ù†" : "Skip for now"}
            </button>
        </div>
    );
}
š šÒ*cascade08
ÒÉ É§*cascade08
§Ë ËÒ *cascade08ÒÓ*cascade08ÓÛ *cascade08ÛÜ*cascade08Üä *cascade08äå*cascade08åè *cascade08
èÈ
 È
×*cascade08
×í í*cascade08
• •©*cascade08
©´ ´Ç*cascade08
ÇÈ ÈË*cascade08
ËÌ ÌĞ*cascade08
ĞÑ ÑŞ*cascade08
Şß ßâ*cascade08
âã ãç*cascade08
çé éë*cascade08
ëì ìî*cascade08
îï ïğ*cascade08
ğó ó¨
¨µ µ¸*cascade08
¸¹ ¹¿*cascade08
¿À ÀÁ*cascade08
ÁÂ ÂÆ*cascade08
ÆÈ ÈÍ*cascade08
ÍÎ ÎÚ*cascade08
ÚÛ Ûğ*cascade08
ğ –*cascade08
–Ñ ÑÉ*cascade08
Éş# ş#€$*cascade08
€$$ $ƒ$*cascade08
ƒ$…$ …$†$*cascade08
†$) ))*cascade08
)Ÿ) Ÿ)¥)*cascade08
¥)í6 "(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/MockOnboardingPage.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version