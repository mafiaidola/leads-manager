�%"use client";

/**
 * Funnels Tab - Sales funnels management
 * Connected to /api/funnels API
 * ~85 lines
 */

import { useState, useEffect, useCallback } from "react";
import { Language, funnelStatusConfig } from "./types";
import { StatusBadge, TabHeader, FilterButtons, CardContainer } from "./shared";

interface FunnelsTabProps { language: Language; }

interface Funnel {
    id: string;
    name: string;
    status: "active" | "draft" | "paused";
    visitors?: number;
    conversions?: number;
}

type FilterType = "all" | "active" | "draft" | "paused";
const filterOptions: { value: FilterType; label: string; labelAr: string }[] = [
    { value: "all", label: "All", labelAr: "الكل" },
    { value: "active", label: "Active", labelAr: "نشط" },
    { value: "draft", label: "Draft", labelAr: "مسودة" },
    { value: "paused", label: "Paused", labelAr: "متوقف" },
];

export function FunnelsTab({ language }: FunnelsTabProps) {
    const [filter, setFilter] = useState<FilterType>("all");
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [loading, setLoading] = useState(true);
    const isRTL = language === "ar";

    const fetchFunnels = useCallback(async () => {
        try {
            const res = await fetch("/api/funnels", { credentials: "include" });
            const json = await res.json();
            if (json.success && json.data) setFunnels(json.data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchFunnels(); }, [fetchFunnels]);

    const filteredFunnels = filter === "all" ? funnels : funnels.filter(f => f.status === filter);
    const colors = ["from-purple-500 to-indigo-500", "from-amber-500 to-orange-500", "from-green-500 to-teal-500", "from-red-500 to-pink-500"];

    return (
        <div className="space-y-4">
            <TabHeader title="Sales Funnels" titleAr="مسارات البيع" isRTL={isRTL} actionLabel="➕ New Funnel" actionLabelAr="➕ مسار جديد" />
            <FilterButtons options={filterOptions} selected={filter} onSelect={setFilter} isRTL={isRTL} />

            {loading ? (
                <div className="p-8 text-center text-gray-400">{isRTL ? "جارٍ التحميل..." : "Loading..."}</div>
            ) : filteredFunnels.length === 0 ? (
                <div className="p-8 text-center text-gray-400">{isRTL ? "لا توجد مسارات" : "No funnels yet"}</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredFunnels.map((funnel, i) => {
                        const rate = funnel.visitors ? ((funnel.conversions || 0) / funnel.visitors * 100).toFixed(1) : "0";
                        return (
                            <CardContainer key={funnel.id}>
                                <div className={`h-2 bg-gradient-to-r ${colors[i % colors.length]}`} />
                                <div className="p-4">
                                    <div className={`flex items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                                        <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{funnel.name}</h3>
                                        <StatusBadge status={funnel.status} config={funnelStatusConfig} isRTL={isRTL} />
                                    </div>
                                    <div className={`grid grid-cols-3 gap-2 text-center ${isRTL ? "direction-rtl" : ""}`}>
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{(funnel.visitors || 0).toLocaleString()}</p>
                                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{isRTL ? "زائر" : "Visitors"}</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-green-600">{funnel.conversions || 0}</p>
                                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{isRTL ? "تحويل" : "Conversions"}</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-amber-600">{rate}%</p>
                                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{isRTL ? "معدل" : "Rate"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContainer>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
�%*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/FunnelsTab.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version