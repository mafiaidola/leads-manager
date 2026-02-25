�@"use client";

/**
 * Customers Tab - Enhanced with search, segments, quick actions
 * Phase 1: Core E-commerce
 */

import { useState } from "react";
import { Language } from "./types";
import { CustomerDetailModal } from "./CustomerDetailModal";

interface CustomersTabProps { language: Language; }

const mockCustomers = [
    { id: "1", name: "Ahmed Ali", nameAr: "أحمد علي", email: "ahmed@email.com", orders: 12, spent: 1250, segment: "VIP", lastOrder: "2 days ago", lastOrderAr: "منذ يومين" },
    { id: "2", name: "Sara Mohamed", nameAr: "سارة محمد", email: "sara@email.com", orders: 8, spent: 840, segment: "Regular", lastOrder: "1 week ago", lastOrderAr: "منذ أسبوع" },
    { id: "3", name: "Omar Hassan", nameAr: "عمر حسن", email: "omar@email.com", orders: 3, spent: 320, segment: "New", lastOrder: "5 days ago", lastOrderAr: "منذ 5 أيام" },
    { id: "4", name: "Fatima Ahmed", nameAr: "فاطمة أحمد", email: "fatima@email.com", orders: 15, spent: 2100, segment: "VIP", lastOrder: "Today", lastOrderAr: "اليوم" },
    { id: "5", name: "Youssef Nour", nameAr: "يوسف نور", email: "youssef@email.com", orders: 1, spent: 89, segment: "New", lastOrder: "3 weeks ago", lastOrderAr: "منذ 3 أسابيع" },
];

type Customer = typeof mockCustomers[0];

const segmentConfig: Record<string, { emoji: string; label: string; labelAr: string; color: string }> = {
    VIP: { emoji: "⭐", label: "VIP", labelAr: "مميز", color: "bg-amber-100 text-amber-700" },
    Regular: { emoji: "👤", label: "Regular", labelAr: "عادي", color: "bg-blue-100 text-blue-700" },
    New: { emoji: "🆕", label: "New", labelAr: "جديد", color: "bg-green-100 text-green-700" },
};

export function CustomersTab({ language }: CustomersTabProps) {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [search, setSearch] = useState("");
    const [segmentFilter, setSegmentFilter] = useState("All");
    const isRTL = language === "ar";

    const segments = ["All", "VIP", "Regular", "New"];
    const filtered = mockCustomers.filter(c => {
        const matchSearch = (isRTL ? c.nameAr : c.name).toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
        const matchSegment = segmentFilter === "All" || c.segment === segmentFilter;
        return matchSearch && matchSegment;
    });

    const totalSpent = filtered.reduce((sum, c) => sum + c.spent, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className={`flex items-center justify-between flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {isRTL ? "العملاء" : "Customers"} <span className="text-gray-400 font-normal">({filtered.length})</span>
                </h2>
                <button className="px-4 py-2 rounded-xl font-medium text-sm" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-primary)" }}>
                    📤 {isRTL ? "تصدير" : "Export"}
                </button>
            </div>

            {/* Search + Segment Filters */}
            <div className={`flex flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="relative flex-1 min-w-[200px]">
                    <span className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"}`}>🔍</span>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={isRTL ? "ابحث بالاسم أو البريد..." : "Search by name or email..."} className={`w-full py-2 ${isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3"} rounded-xl border`} style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                </div>
                {segments.map(s => (
                    <button key={s} onClick={() => setSegmentFilter(s)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${segmentFilter === s ? "bg-amber-500 text-white" : ""}`} style={segmentFilter !== s ? { backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)" } : {}}>
                        {s === "All" ? (isRTL ? "الكل" : "All") : `${segmentConfig[s].emoji} ${s}`}
                    </button>
                ))}
            </div>

            {/* Segment Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-center"><p className="text-2xl font-bold text-amber-700">2</p><p className="text-xs text-amber-600">⭐ VIP</p></div>
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 text-center"><p className="text-2xl font-bold text-blue-700">1</p><p className="text-xs text-blue-600">👤 {isRTL ? "عادي" : "Regular"}</p></div>
                <div className="p-4 rounded-xl border border-green-200 bg-green-50/50 text-center"><p className="text-2xl font-bold text-green-700">2</p><p className="text-xs text-green-600">🆕 {isRTL ? "جديد" : "New"}</p></div>
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 text-center"><p className="text-2xl font-bold text-purple-700">${totalSpent}</p><p className="text-xs text-purple-600">{isRTL ? "إجمالي المبيعات" : "Total Spent"}</p></div>
            </div>

            {/* Customer List */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                {filtered.map((customer, i) => (
                    <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className={`p-4 flex items-center gap-4 hover:bg-amber-50/50 dark:hover:bg-gray-700/30 cursor-pointer ${isRTL ? "flex-row-reverse" : ""} ${i !== filtered.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(135deg, #fbbf24, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", direction: "ltr" }}>
                            <span style={{ color: "white", fontWeight: "bold" }}>{customer.name.charAt(0)}</span>
                        </div>
                        <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{isRTL ? customer.nameAr : customer.name}</p>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{customer.email}</p>
                        </div>
                        <div className="text-center hidden sm:block"><p className="font-bold" style={{ color: "var(--text-primary)" }}>{customer.orders}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{isRTL ? "طلبات" : "orders"}</p></div>
                        <div className="text-center"><p className="font-bold text-green-600">${customer.spent}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{isRTL ? "إجمالي" : "spent"}</p></div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${segmentConfig[customer.segment].color}`}>{segmentConfig[customer.segment].emoji} {isRTL ? segmentConfig[customer.segment].labelAr : customer.segment}</span>
                        {/* Quick Actions */}
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600" title="Email">📧</button>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="View">👁️</button>
                        </div>
                    </div>
                ))}
            </div>

            <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} language={language} />
        </div>
    );
}
�@"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/CustomersTab.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version