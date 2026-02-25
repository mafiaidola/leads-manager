�0"use client";

/**
 * Marketing Tab - Coupons and campaigns
 * Connected to /api/discounts API (same as PromotionsTab)
 * ~90 lines
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Language } from "./types";

interface MarketingTabProps { language: Language; }

interface Discount {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    is_active: boolean;
    usage_count?: number;
    usage_limit?: number;
}

export function MarketingTab({ language }: MarketingTabProps) {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const isRTL = language === "ar";

    const fetchDiscounts = useCallback(async () => {
        try {
            const res = await fetch("/api/discounts", { credentials: "include" });
            const json = await res.json();
            if (json.success) setDiscounts(json.data || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

    const activeCount = discounts.filter(d => d.is_active).length;
    const totalUses = discounts.reduce((sum, d) => sum + (d.usage_count || 0), 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    {isRTL ? "التسويق" : "Marketing"}
                </h2>
                <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm">
                    {isRTL ? "➕ إنشاء حملة" : "➕ Create Campaign"}
                </button>
            </div>

            {/* Quick Stats - Now from real data */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{loading ? "-" : activeCount}</p>
                    <p className="text-sm text-purple-600">{isRTL ? "كوبونات نشطة" : "Active Coupons"}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{discounts.length}</p>
                    <p className="text-sm text-blue-600">{isRTL ? "إجمالي الكوبونات" : "Total Coupons"}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 text-center">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{loading ? "-" : totalUses}</p>
                    <p className="text-sm text-green-600">{isRTL ? "استخدامات" : "Total Uses"}</p>
                </div>
            </div>

            {/* Coupons List - From Real API */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className={`p-4 border-b border-gray-100 dark:border-gray-700 ${isRTL ? "text-right" : ""}`}>
                    <h3 className="font-bold text-gray-800 dark:text-white">{isRTL ? "كوبونات الخصم" : "Discount Coupons"}</h3>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-400">{isRTL ? "جارٍ التحميل..." : "Loading..."}</div>
                ) : discounts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">{isRTL ? "لا توجد كوبونات" : "No coupons yet"}</div>
                ) : discounts.map((d) => (
                    <div key={d.id} className={`p-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 last:border-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono font-bold text-gray-800 dark:text-white">{d.code}</div>
                        <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                            <p className="font-semibold text-amber-600">{d.type === "percentage" ? `${d.value}%` : `$${d.value}`} {isRTL ? "خصم" : "off"}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-gray-800 dark:text-white">{d.usage_count || 0}/{d.usage_limit || "∞"}</p>
                            <p className="text-xs text-gray-400">{isRTL ? "استخدامات" : "uses"}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {d.is_active ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}
                        </span>
                    </div>
                ))}
            </div>

            {/* Email Campaigns - Coming Soon */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className={`font-bold text-gray-800 dark:text-white mb-4 ${isRTL ? "text-right" : ""}`}>
                    {isRTL ? "حملات البريد الإلكتروني" : "Email Campaigns"}
                </h3>
                <div className="text-center py-8">
                    <span className="text-5xl mb-4 block">📧</span>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isRTL ? "قريباً - إدارة حملات البريد الإلكتروني" : "Coming soon - Email campaign management"}
                    </p>
                </div>
            </div>
        </div>
    );
}
�0*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/MarketingTab.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version