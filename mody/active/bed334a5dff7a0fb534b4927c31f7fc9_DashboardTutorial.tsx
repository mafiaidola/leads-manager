� "use client";

/**
 * Dashboard Tutorial - Quick spotlight tour for new users
 * Shows 4 steps highlighting key areas
 */

import { useState, useEffect } from "react";
import { Language } from "./types";

interface DashboardTutorialProps {
    language: Language;
    onComplete: () => void;
}

const steps = [
    { id: 1, emoji: "🏪", en: "Here's your store! Click to manage it.", ar: "هذا متجرك! انقر لإدارته.", position: "top-32 left-1/2 -translate-x-1/2" },
    { id: 2, emoji: "📐", en: "Open Builder to customize your design.", ar: "افتح الباني لتخصيص التصميم.", position: "top-1/2 left-48" },
    { id: 3, emoji: "📦", en: "Add products to start selling.", ar: "أضف منتجات للبدء بالبيع.", position: "top-1/2 left-48" },
    { id: 4, emoji: "👁️", en: "Preview your store anytime with View Live.", ar: "معاينة متجرك في أي وقت.", position: "top-32 right-32" },
];

export function DashboardTutorial({ language, onComplete }: DashboardTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(true);
    const isRTL = language === "ar";

    // Check if tutorial already completed
    useEffect(() => {
        if (typeof window !== "undefined") {
            const completed = localStorage.getItem("egybag_tutorial_done");
            if (completed) setVisible(false);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem("egybag_tutorial_done", "true");
        setVisible(false);
        onComplete();
    };

    if (!visible) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60" onClick={handleComplete} />

            {/* Tutorial Card */}
            <div className={`absolute ${step.position} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm animate-fadeIn z-50`}>
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">{step.emoji}</span>
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white text-lg">
                            {isRTL ? step.ar : step.en}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {isRTL ? `الخطوة ${currentStep + 1} من ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button onClick={handleComplete} className="flex-1 py-2 text-gray-500 hover:text-gray-700 text-sm">
                        {isRTL ? "تخطي" : "Skip"}
                    </button>
                    <button onClick={handleNext} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-medium">
                        {currentStep < steps.length - 1 ? (isRTL ? "التالي" : "Next") : (isRTL ? "فهمت!" : "Got it!")}
                    </button>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {steps.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? "bg-blue-500" : "bg-gray-200"}`} />
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            `}</style>
        </div>
    );
}
� "(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/DashboardTutorial.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version