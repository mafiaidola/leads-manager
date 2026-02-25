�"use client";

/**
 * Store Created Celebration Modal
 * Shows confetti + greeting after successful store creation
 */

import { useEffect, useState } from "react";
import { Language } from "./types";
import { Confetti } from "@/components/ui/confetti";

interface StoreCreatedCelebrationProps {
    storeName: string;
    storeUrl: string;
    language: Language;
    onContinue: () => void;
}

export function StoreCreatedCelebration({ storeName, storeUrl, language, onContinue }: StoreCreatedCelebrationProps) {
    const [showConfetti, setShowConfetti] = useState(true);
    const isRTL = language === "ar";

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center z-50">
            <Confetti isActive={showConfetti} duration={5000} />

            <div className="text-center text-white p-8 max-w-md animate-fadeIn">
                {/* Success Icon */}
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm animate-bounce">
                    <span className="text-6xl">🎉</span>
                </div>

                <h1 className="text-4xl font-bold mb-4">
                    {isRTL ? "مبروك!" : "Congratulations!"}
                </h1>

                <p className="text-xl opacity-90 mb-2">
                    {isRTL ? "متجرك جاهز" : "Your store is ready"}
                </p>

                <p className="text-3xl font-bold mb-6">{storeName}</p>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-8">
                    <p className="text-sm opacity-75 mb-1">{isRTL ? "رابط متجرك" : "Your store URL"}</p>
                    <p className="text-lg font-mono">{storeUrl}</p>
                </div>

                <button
                    onClick={onContinue}
                    className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-2xl hover:scale-105 transition-transform"
                >
                    {isRTL ? "→ إلى لوحة التحكم" : "Go to Dashboard →"}
                </button>

                <p className="text-sm opacity-60 mt-4">
                    {isRTL ? "سنريك أين تجد كل شيء" : "We'll show you around"}
                </p>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
            `}</style>
        </div>
    );
}
�"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/StoreCreatedCelebration.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version