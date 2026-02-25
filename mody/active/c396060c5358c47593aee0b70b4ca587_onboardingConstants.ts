�/**
 * Onboarding Constants
 * Extracted from MockOnboardingPage.tsx for file size compliance
 */

// User-friendly error messages (API error → display message)
export const errorMessages: Record<string, { en: string; ar: string }> = {
    "This subdomain is reserved": { en: "This name is reserved. Try a different name!", ar: "هذا الاسم محجوز. جرب اسماً آخر!" },
    "Subdomain already taken": { en: "This name is taken. Try another!", ar: "هذا الاسم مستخدم. جرب اسماً آخر!" },
    "UNAUTHORIZED": { en: "Please log in first", ar: "الرجاء تسجيل الدخول أولاً" },
    "VALIDATION_ERROR": { en: "Please check your input", ar: "الرجاء مراجعة المدخلات" },
};

// Starter templates for onboarding
export const starterTemplates = [
    { id: "fashion", name: "Fashion Store", nameAr: "متجر أزياء", emoji: "👗", color: "from-pink-500 to-rose-500" },
    { id: "electronics", name: "Electronics", nameAr: "إلكترونيات", emoji: "📱", color: "from-blue-500 to-cyan-500" },
    { id: "food", name: "Food & Grocery", nameAr: "طعام وبقالة", emoji: "🍕", color: "from-orange-500 to-amber-500" },
    { id: "beauty", name: "Beauty & Health", nameAr: "جمال وصحة", emoji: "💄", color: "from-purple-500 to-pink-500" },
    { id: "home", name: "Home & Living", nameAr: "منزل ومعيشة", emoji: "🏠", color: "from-green-500 to-emerald-500" },
    { id: "minimal", name: "Minimal", nameAr: "بسيط", emoji: "✨", color: "from-gray-600 to-gray-800" },
];

/**
 * Generate valid subdomain from store name
 * - Lowercase, alphanumeric + hyphens
 * - No leading/trailing hyphens
 * - Min 3 chars, adds suffix if needed
 * - Adds timestamp for uniqueness
 */
export function generateSubdomain(name: string): string {
    let subdomain = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 20);

    if (subdomain.length < 3) {
        subdomain = subdomain + "-shop"; // 'store' is reserved
    }

    return subdomain + "-" + Date.now().toString(36).slice(-4);
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: string, isRTL: boolean): string {
    for (const key in errorMessages) {
        if (error.includes(key)) {
            return isRTL ? errorMessages[key].ar : errorMessages[key].en;
        }
    }
    return isRTL ? "حدث خطأ. حاول مجدداً." : "Something went wrong. Please try again.";
}
�*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/onboardingConstants.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version