�)/**
 * Mockup Types, Data, and Configs
 * Translations moved to translations.ts
 * ~120 lines
 */

export type PropertyType = "store" | "website" | "funnel";
export type Language = "en" | "ar";
export type Theme = "light" | "dark";

export interface Property {
    id: string;
    name: string;
    nameAr: string;
    type: PropertyType;
    emoji: string;
    url: string;
    isLive: boolean;
    templateId?: string;
}

// Type config with colors
export const typeConfig: Record<PropertyType, { emoji: string; label: string; labelAr: string; color: string; darkColor: string }> = {
    store: { emoji: "🛒", label: "Store", labelAr: "متجر", color: "bg-amber-100 text-amber-700 border-amber-200", darkColor: "dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700" },
    website: { emoji: "🌐", label: "Website", labelAr: "موقع", color: "bg-blue-100 text-blue-700 border-blue-200", darkColor: "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" },
    funnel: { emoji: "🚀", label: "Funnel", labelAr: "قمع", color: "bg-purple-100 text-purple-700 border-purple-200", darkColor: "dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700" },
};

// Re-export translations from dedicated file
export { translations, type Translations } from "./translations";

// ===== SHARED STATUS CONFIGS =====
export const orderStatusConfig = {
    pending: { color: "bg-amber-100 text-amber-700", label: "Pending", labelAr: "قيد الانتظار" },
    processing: { color: "bg-blue-100 text-blue-700", label: "Processing", labelAr: "قيد المعالجة" },
    shipped: { color: "bg-purple-100 text-purple-700", label: "Shipped", labelAr: "تم الشحن" },
    delivered: { color: "bg-green-100 text-green-700", label: "Delivered", labelAr: "تم التسليم" },
    cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled", labelAr: "ملغي" },
};

export const leadStatusConfig = {
    new: { color: "bg-blue-100 text-blue-700", label: "New", labelAr: "جديد" },
    contacted: { color: "bg-amber-100 text-amber-700", label: "Contacted", labelAr: "تم التواصل" },
    qualified: { color: "bg-purple-100 text-purple-700", label: "Qualified", labelAr: "مؤهل" },
    converted: { color: "bg-green-100 text-green-700", label: "Converted", labelAr: "تم التحويل" },
};

export const funnelStatusConfig = {
    active: { color: "bg-green-100 text-green-700", label: "Active", labelAr: "نشط" },
    draft: { color: "bg-gray-100 text-gray-700", label: "Draft", labelAr: "مسودة" },
    paused: { color: "bg-amber-100 text-amber-700", label: "Paused", labelAr: "متوقف" },
};

export const paymentStatusConfig = {
    enabled: { color: "bg-green-100 text-green-700", label: "Enabled", labelAr: "مفعل" },
    disabled: { color: "bg-gray-100 text-gray-700", label: "Disabled", labelAr: "معطل" },
};

export const promotionStatusConfig = {
    active: { color: "bg-green-100 text-green-700", label: "Active", labelAr: "نشط" },
    scheduled: { color: "bg-blue-100 text-blue-700", label: "Scheduled", labelAr: "مجدول" },
    expired: { color: "bg-gray-100 text-gray-700", label: "Expired", labelAr: "منتهي" },
};

// ===== MOCK TEMPLATES =====
export interface MockTemplate {
    id: string;
    type: PropertyType;
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    sections: number;
    color: string;
    preview: string;
    thumbnail?: string;
}

export const mockTemplates: MockTemplate[] = [
    {
        id: "luxe-kicks-premium",
        type: "store",
        name: "Luxe Kicks - Premium Store",
        nameAr: "لوكس كيكس - متجر فاخر",
        description: "Premium dark-themed sneaker store with hero showcase",
        descriptionAr: "متجر أحذية رياضية فاخر بتصميم داكن",
        sections: 5,
        color: "from-red-600 to-red-900",
        preview: "👟",
        thumbnail: "/template-products/sneaker-5.png"
    },
    {
        id: "portfolio",
        type: "website",
        name: "Portfolio",
        nameAr: "معرض أعمال",
        description: "Professional portfolio & services showcase",
        descriptionAr: "معرض أعمال احترافي وخدمات",
        sections: 4,
        color: "from-blue-500 to-indigo-600",
        preview: "🌐"
    },
    {
        id: "lead-capture",
        type: "funnel",
        name: "Lead Capture",
        nameAr: "صفحة هبوط",
        description: "High-converting landing page",
        descriptionAr: "صفحة هبوط عالية التحويل",
        sections: 3,
        color: "from-green-500 to-emerald-600",
        preview: "🚀"
    },
];

// Theme CSS variables
export const themeStyles: Record<Theme, Record<string, string>> = {
    light: {
        "--bg-primary": "#f9fafb", "--bg-secondary": "#ffffff", "--bg-card": "#ffffff",
        "--bg-hover": "#f3f4f6", "--text-primary": "#111827", "--text-secondary": "#6b7280", "--border": "#e5e7eb",
    },
    dark: {
        "--bg-primary": "#111827", "--bg-secondary": "#1f2937", "--bg-card": "#1f2937",
        "--bg-hover": "#374151", "--text-primary": "#f9fafb", "--text-secondary": "#9ca3af", "--border": "#374151",
    },
};
 *cascade08**cascade08*7 *cascade087:*cascade08:; *cascade08;<*cascade08<= *cascade08=?*cascade08?L *cascade08LP*cascade08PQ *cascade08QR*cascade08RS *cascade08SW*cascade08WX *cascade08X\*cascade08\�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�	 *cascade08�	�	*cascade08�	�
 *cascade08�
�
*cascade08�
�
 *cascade08�
�
*cascade08�
�) *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/types.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version