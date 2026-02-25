�G"use client";

/**
 * Property Dashboard Component - Receives tab state from parent
 */

import { Property, Language, translations } from "./types";
import { DashboardTab } from "./Sidebar";
import { OrdersTab } from "./OrdersTab";
import { ProductsTab } from "./ProductsTab";
import { CustomersTab } from "./CustomersTab";
import { SettingsTab } from "./SettingsTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { MarketingTab } from "./MarketingTab";
import { DesignTab } from "./DesignTab";
import { CategoriesTab } from "./CategoriesTab";
import { SitesTab } from "./SitesTab";
import { StoreBuilderTab } from "./StoreBuilderTab";
import { ShippingTab } from "./ShippingTab";
import { PaymentsTab } from "./PaymentsTab";
import { PromotionsTab } from "./PromotionsTab";
import { MediaTab } from "./MediaTab";
import { LeadsTab } from "./LeadsTab";
import { FunnelsTab } from "./FunnelsTab";
import { DomainTab } from "./DomainTab";

interface PropertyDashboardProps {
    property: Property;
    onBack: () => void;
    onTabChange: (tab: DashboardTab) => void;
    activeTab: DashboardTab;
    language: Language;
    onEdit?: () => void;
}

export function PropertyDashboard({ property, onBack, onTabChange, activeTab, language, onEdit }: PropertyDashboardProps) {
    const t = translations[language];
    const isRTL = language === "ar";

    const tabs: { id: DashboardTab; emoji: string; label: string }[] = [
        { id: "overview", emoji: "📊", label: isRTL ? "نظرة عامة" : "Overview" },
        { id: "products", emoji: "📦", label: t.products },
        { id: "orders", emoji: "🛒", label: t.orders },
        { id: "customers", emoji: "👥", label: t.customers },
        { id: "categories", emoji: "🏷️", label: t.categories },
        { id: "sites", emoji: "🌐", label: t.sites },
        { id: "builder", emoji: "🔧", label: t.builder },
        { id: "shipping", emoji: "🚚", label: t.shipping },
        { id: "payments", emoji: "💳", label: t.payments },
        { id: "promotions", emoji: "🎁", label: t.promotions },
        { id: "media", emoji: "🖼️", label: t.media },
        { id: "design", emoji: "🎨", label: isRTL ? "التصميم" : "Design" },
        { id: "analytics", emoji: "📈", label: isRTL ? "التحليلات" : "Analytics" },
        { id: "marketing", emoji: "📣", label: isRTL ? "التسويق" : "Marketing" },
        { id: "settings", emoji: "⚙️", label: t.settings },
        { id: "leads", emoji: "📊", label: isRTL ? "العملاء المحتملين" : "Leads" },
        { id: "funnels", emoji: "🎯", label: isRTL ? "مسارات البيع" : "Funnels" },
        { id: "domain", emoji: "🌐", label: isRTL ? "النطاقات" : "Domains" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300">
                        {isRTL ? "→" : "←"}
                    </button>
                    <span className="text-4xl">{property.emoji}</span>
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {isRTL ? property.nameAr : property.name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">{property.url}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <button onClick={onEdit} className={`flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium ${isRTL ? "flex-row-reverse" : ""}`}>
                        ✏️ {isRTL ? "تحرير" : "Edit"}
                    </button>
                    <button className={`flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium ${isRTL ? "flex-row-reverse" : ""}`}>
                        👁️ {t.viewLive}
                    </button>
                </div>
            </div>

            {/* Tabs - Scrollable, synced with sidebar */}
            <div className={`flex gap-2 overflow-x-auto pb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${isRTL ? "flex-row-reverse" : ""} ${activeTab === tab.id
                            ? "bg-amber-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                            }`}
                    >
                        <span>{tab.emoji}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isRTL ? "text-right" : ""}`}>
                        {[
                            { emoji: "📦", label: t.products, count: "45", tab: "products" as DashboardTab },
                            { emoji: "🛒", label: t.orders, count: "12", tab: "orders" as DashboardTab },
                            { emoji: "👥", label: t.customers, count: "156", tab: "customers" as DashboardTab },
                            { emoji: "💰", label: t.earnings, count: "$1,250", tab: "analytics" as DashboardTab },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center cursor-pointer hover:shadow-lg transition-all"
                                onClick={() => onTabChange(item.tab)}
                            >
                                <span className="text-3xl block mb-2">{item.emoji}</span>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{item.count}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-center">
                        <span className="text-5xl mb-4 block">🚀</span>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                            {isRTL ? "ابدأ البيع!" : "Start selling!"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {isRTL ? "أضف منتجات وابدأ استقبال الطلبات" : "Add products and start receiving orders"}
                        </p>
                        <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium" onClick={() => onTabChange("products")}>
                            {isRTL ? "➕ إضافة منتج" : "➕ Add Product"}
                        </button>
                    </div>
                </div>
            )}
            {activeTab === "products" && <ProductsTab language={language} />}
            {activeTab === "orders" && <OrdersTab language={language} />}
            {activeTab === "customers" && <CustomersTab language={language} />}
            {activeTab === "categories" && <CategoriesTab language={language} />}
            {activeTab === "sites" && <SitesTab language={language} />}
            {activeTab === "builder" && <StoreBuilderTab language={language} />}
            {activeTab === "shipping" && <ShippingTab language={language} />}
            {activeTab === "payments" && <PaymentsTab language={language} />}
            {activeTab === "promotions" && <PromotionsTab language={language} />}
            {activeTab === "media" && <MediaTab language={language} />}
            {activeTab === "design" && <DesignTab language={language} />}
            {activeTab === "analytics" && <AnalyticsTab language={language} />}
            {activeTab === "marketing" && <MarketingTab language={language} />}
            {activeTab === "settings" && <SettingsTab language={language} />}
            {activeTab === "leads" && <LeadsTab language={language} />}
            {activeTab === "funnels" && <FunnelsTab language={language} />}
            {activeTab === "domain" && <DomainTab language={language} />}
        </div>
    );
}
�G"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/PropertyDashboard.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version