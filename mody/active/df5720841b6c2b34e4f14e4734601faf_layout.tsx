Ğ"use client";

/**
 * Dashboard Layout - NEW MOCK DESIGN with Context
 * Uses DashboardProvider for shared state
 * ~85 lines - AI friendly
 */

import { useEffect } from "react";
import { TopBar } from "../TopBar";
import { Sidebar } from "../Sidebar";
import { DashboardProvider, useDashboard } from "../DashboardContext";

interface LayoutProps { children: React.ReactNode; }

function DashboardLayoutInner({ children }: LayoutProps) {
    const {
        stores, selectedStore, setSelectedStore,
        activeTab, setActiveTab,
        language, setLanguage, theme, setTheme
    } = useDashboard();

    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const isRTL = language === "ar";

    // CSS variables for theme
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.style.setProperty("--bg-card", "#1f2937");
            root.style.setProperty("--bg-hover", "#374151");
            root.style.setProperty("--border", "#374151");
            root.style.setProperty("--text-primary", "#f9fafb");
            root.style.setProperty("--text-secondary", "#9ca3af");
        } else {
            root.style.setProperty("--bg-card", "#ffffff");
            root.style.setProperty("--bg-hover", "#f3f4f6");
            root.style.setProperty("--border", "#e5e7eb");
            root.style.setProperty("--text-primary", "#111827");
            root.style.setProperty("--text-secondary", "#6b7280");
        }
    }, [theme]);

    return (
        <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
            <TopBar
                onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                mobileMenuOpen={mobileMenuOpen}
                language={language}
                theme={theme}
                onLanguageChange={setLanguage}
                onThemeChange={setTheme}
                onTabChange={setActiveTab}
            />

            <Sidebar
                properties={stores}
                selectedProperty={selectedStore}
                onSelectProperty={setSelectedStore}
                onTabChange={setActiveTab}
                onCreateNew={() => { }}
                activeTab={activeTab}
                sidebarOpen={sidebarOpen}
                mobileMenuOpen={mobileMenuOpen}
                language={language}
                theme={theme}
            />

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <main
                className={`pt-16 min-h-screen transition-all duration-300 ${sidebarOpen ? (isRTL ? "lg:pr-72" : "lg:pl-72") : (isRTL ? "lg:pr-20" : "lg:pl-20")
                    }`}
                dir={isRTL ? "rtl" : "ltr"}
            >
                <div className="p-6 max-w-6xl mx-auto">{children}</div>
            </main>
        </div>
    );
}

import React from "react";

export default function NewDashboardLayout({ children }: LayoutProps) {
    return (
        <DashboardProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </DashboardProvider>
    );
}
' *cascade08'(*cascade08(* *cascade08*,*cascade08,- *cascade08-8*cascade088E*cascade08EI *cascade08IJ*cascade08JN *cascade08NP*cascade08PQ *cascade08QS*cascade08ST *cascade08TU *cascade08UY*cascade08YZ *cascade08Z\*cascade08\] *cascade08]^ *cascade08^` *cascade08`a*cascade08ab *cascade08bc*cascade08cd *cascade08dh *cascade08hi*cascade08ij *cascade08jp*cascade08pu *cascade08uw*cascade08w *cascade08¢*cascade08¢¬ *cascade08¬±*cascade08±¾ *cascade08¾À*cascade08ÀÌ *cascade08ÌÎ*cascade08ÎÏ *cascade08ÏĞ*cascade08Ğá *cascade08áâ*cascade08âã *cascade08ãä*cascade08äå *cascade08åæ*cascade08æñ *cascade08ñó*cascade08ó‡ *cascade08‡ˆ*cascade08ˆ‰ *cascade08‰*cascade08 *cascade08–*cascade08–— *cascade08—˜*cascade08˜™*cascade08™š *cascade08šœ*cascade08œ *cascade08¢*cascade08¢£ *cascade08£¤*cascade08¤¥ *cascade08¥¦*cascade08¦¯ *cascade08¯±*cascade08±² *cascade08²¾*cascade08¾¿ *cascade08¿À *cascade08ÀÂ*cascade08Âø *cascade08øù*cascade08ù” *cascade08”™*cascade08™Á *cascade08ÁÕ*cascade08ÕÖ *cascade08Öü*cascade08üı *cascade08ıƒ*cascade08ƒ„ *cascade08„…*cascade08…Š *cascade08Š*cascade08¥ *cascade08¥¦*cascade08¦² *cascade08²³*cascade08³Ã *cascade08ÃÉ*cascade08ÉÏ *cascade08ÏĞ*cascade08ĞÑ *cascade08ÑÒ*cascade08ÒÓ *cascade08ÓØ*cascade08ØÛ *cascade08ÛÜ*cascade08Üè *cascade08èƒ *cascade08ƒ„*cascade08„‡ *cascade08‡*cascade08’ *cascade08’—*cascade08—˜ *cascade08˜™*cascade08™§ *cascade08§«*cascade08«¬ *cascade08¬¸*cascade08¸¹ *cascade08¹º*cascade08º» *cascade08»¿*cascade08¿À *cascade08ÀÊ*cascade08ÊÍ *cascade08ÍÓ*cascade08ÓÖ *cascade08ÖØ*cascade08ØÚ *cascade08ÚÛ*cascade08ÛÜ *cascade08Üá*cascade08áî *cascade08îï *cascade08ïğ *cascade08ğñ*cascade08ñò *cascade08òó*cascade08óö *cascade08öú*cascade08úû *cascade08ûü *cascade08üı*cascade08ış *cascade08şÿ *cascade08ÿ*cascade08ƒ *cascade08ƒ„*cascade08„† *cascade08†‡*cascade08‡ *cascade08—*cascade08—˜ *cascade08˜œ*cascade08œ *cascade08£*cascade08£¤ *cascade08¤­*cascade08­® *cascade08®Í*cascade08ÍÎ *cascade08ÎÚ*cascade08ÚÛ *cascade08Ûø*cascade08øú *cascade08ú*cascade08– *cascade08–—*cascade08—˜ *cascade08˜¢*cascade08¢£ *cascade08£¥*cascade08¥¦ *cascade08¦¬*cascade08¬­ *cascade08­±*cascade08±´ *cascade08´·*cascade08·¸ *cascade08¸¹*cascade08¹º *cascade08ºß*cascade08ßà *cascade08àâ*cascade08âã *cascade08ãğ*cascade08ğó *cascade08ó¢*cascade08¢£ *cascade08£¨*cascade08¨© *cascade08©«*cascade08«¬ *cascade08¬¼*cascade08¼½ *cascade08½Ì*cascade08ÌÍ *cascade08Íñ*cascade08ñó *cascade08óş*cascade08şÿ *cascade08ÿ	*cascade08		 *cascade08	–	*cascade08–	—	 *cascade08—	§	*cascade08§	¨	 *cascade08¨	¼	*cascade08¼	½	 *cascade08½	Â	*cascade08Â	Ã	 *cascade08Ã	Å	*cascade08Å	Î	 *cascade08Î	Ï	*cascade08Ï	Ğ	 *cascade08Ğ	Ô	*cascade08Ô	Õ	 *cascade08Õ	×	*cascade08×	Ù	 *cascade08Ù	ô	*cascade08ô	õ	 *cascade08õ	ş	*cascade08ş	ÿ	 *cascade08ÿ	
*cascade08
‚
 *cascade08‚
ƒ
*cascade08ƒ
„
 *cascade08„
¨
*cascade08¨
©
 *cascade08©
«
*cascade08«
¬
 *cascade08¬
±
*cascade08±
´
 *cascade08´
½
*cascade08½
¾
 *cascade08¾
Ã
*cascade08Ã
Ä
 *cascade08Ä
Ï
*cascade08Ï
Ü
 *cascade08Ü
Ş
*cascade08Ş
ß
 *cascade08ß
ä
*cascade08ä
æ
 *cascade08æ
ş
*cascade08ş
ÿ
 *cascade08ÿ
…*cascade08…† *cascade08†—*cascade08—˜ *cascade08˜Ÿ*cascade08Ÿ  *cascade08 º*cascade08º» *cascade08»¼*cascade08¼½ *cascade08½¿*cascade08¿À *cascade08ÀË*cascade08ËØ *cascade08Øİ*cascade08İŞ *cascade08Şá*cascade08áâ *cascade08âç*cascade08çè *cascade08èé*cascade08éë *cascade08ëû*cascade08ûü *cascade08ü”*cascade08”• *cascade08•Ÿ*cascade08Ÿ  *cascade08 « *cascade08«¯ *cascade08¯¸*cascade08¸À *cascade08ÀÄ*cascade08ÄÏ *cascade08ÏÒ*cascade08ÒÔ *cascade08Ô×*cascade08×Ø *cascade08ØÚ*cascade08ÚÛ *cascade08Ûà*cascade08àá *cascade08áö*cascade08ö÷ *cascade08÷ş*cascade08şÿ *cascade08ÿ€*cascade08€ *cascade08‚*cascade08‚ƒ *cascade08ƒ„*cascade08„‡ *cascade08‡‰*cascade08‰Š *cascade08ŠŒ*cascade08Œ *cascade08“*cascade08“  *cascade08 ®*cascade08®¶ *cascade08¶¸*cascade08¸º *cascade08ºÂ*cascade08ÂÃ *cascade08ÃÄ*cascade08ÄÏ *cascade08ÏÒ*cascade08ÒÓ *cascade08ÓÔ*cascade08ÔÕ *cascade08ÕÙ*cascade08ÙŞ *cascade08Şã*cascade08ãä *cascade08äë*cascade08ëì *cascade08ìí*cascade08í€ *cascade08€ *cascade08 ¤ *cascade08¤°*cascade08°² *cascade08²·*cascade08·¹ *cascade08¹º*cascade08º» *cascade08»Á*cascade08ÁÂ *cascade08ÂÃ*cascade08ÃÔ *cascade08Ôá*cascade08áâ *cascade08âæ*cascade08æò *cascade08ò*cascade08 *cascade08 *cascade08 ¡ *cascade08¡­*cascade08­® *cascade08®°*cascade08°² *cascade08²º*cascade08º» *cascade08»Ô*cascade08ÔÕ *cascade08Õ×*cascade08×Ø *cascade08ØÜ*cascade08ÜŞ *cascade08Şß*cascade08ßà *cascade08àâ*cascade08âã *cascade08ãî*cascade08îï *cascade08ïñ*cascade08ñò *cascade08òô*cascade08ô‰ *cascade08‰*cascade08 *cascade08¡*cascade08¡¢ *cascade08¢£*cascade08£¤ *cascade08¤¦ *cascade08¦¨*cascade08¨ª *cascade08ªÀ*cascade08ÀÂ *cascade08ÂÎ*cascade08ÎÑ *cascade08ÑÒ*cascade08ÒÔ *cascade08ÔØ *cascade08ØÚ*cascade08ÚÜ *cascade08Üİ*cascade08İŞ *cascade08Şè*cascade08èé *cascade08éï*cascade08ïñ *cascade08ñö*cascade08ö÷ *cascade08÷û*cascade08ûü *cascade08üÿ*cascade08ÿ *cascade08‰*cascade08‰Œ *cascade08Œ*cascade08‘ *cascade08‘“ *cascade08“—*cascade08—£ *cascade08£ª*cascade08ª« *cascade08«¶*cascade08¶· *cascade08·Ì*cascade08ÌÍ *cascade08ÍÎ*cascade08ÎĞ *cascade08ĞÔ*cascade08ÔÖ *cascade08Öâ*cascade08âã *cascade08ãä*cascade08äæ *cascade08æç*cascade08çó *cascade08óù*cascade08ùû *cascade08û‹*cascade08‹ *cascade08¢*cascade08¢£ *cascade08£¥*cascade08¥¦ *cascade08¦©*cascade08©ª *cascade08ª«*cascade08«¬ *cascade08¬¯*cascade08¯° *cascade08°Ç*cascade08ÇÈ *cascade08ÈÎ*cascade08ÎÏ *cascade08ÏÓ*cascade08ÓÔ *cascade08ÔÙ*cascade08ÙÚ *cascade08ÚŞ*cascade08Şß *cascade08ßå*cascade08åø *cascade08øû*cascade08ûü *cascade08üı*cascade08ı€ *cascade08€‚*cascade08‚ƒ *cascade08ƒ‰*cascade08‰š *cascade08šª*cascade08ª² *cascade08²·*cascade08·Ä *cascade08ÄÅ *cascade08ÅÇ *cascade08ÇÎ*cascade08ÎÏ *cascade08ÏÒ*cascade08Ò× *cascade08×Ø*cascade08Øé *cascade08éí *cascade08íò *cascade08òó *cascade08óú*cascade08úû *cascade08ûı*cascade08ış *cascade08ş‚*cascade08‚ƒ *cascade08ƒ†*cascade08†‡ *cascade08‡‹*cascade08‹Œ *cascade08Œ*cascade08 *cascade08—*cascade08—› *cascade08›¡*cascade08¡¥ *cascade08¥®*cascade08®¯ *cascade08¯±*cascade08±´ *cascade08´·*cascade08·¸ *cascade08¸¿*cascade08¿Ã *cascade08ÃË *cascade08ËÏ*cascade08ÏÛ *cascade08Ûß*cascade08ßë *cascade08ëğ*cascade08ğ *cascade08ƒ*cascade08ƒ… *cascade08…—*cascade08—˜ *cascade08˜›*cascade08› *cascade08Ÿ*cascade08Ÿ  *cascade08 ¨*cascade08¨ª *cascade08ª³*cascade08³´ *cascade08´µ*cascade08µ· *cascade08·Ç*cascade08ÇÈ *cascade08ÈÉ*cascade08ÉÊ *cascade08ÊÌ *cascade08ÌÍ*cascade08ÍÎ *cascade08ÎÏ *cascade08ÏÕ*cascade08Õ× *cascade08×Û*cascade08ÛÜ *cascade08Üß*cascade08ßà *cascade08àæ*cascade08æç *cascade08çè*cascade08èé *cascade08éì *cascade08ìí*cascade08íï *cascade08ïğ *cascade08ğñ*cascade08ñò*cascade08òó *cascade08óü*cascade08üş *cascade08şÿ*cascade08ÿ€ *cascade08€ƒ*cascade08ƒ„ *cascade08„Š*cascade08Š‹ *cascade08‹Œ*cascade08Œ *cascade08‘*cascade08‘¦ *cascade08¦Â*cascade08ÂÃ *cascade08ÃÈ*cascade08ÈÉ *cascade08ÉÊ*cascade08ÊË *cascade08ËÒ*cascade08ÒÓ *cascade08ÓÙ*cascade08ÙÚ *cascade08Úâ*cascade08âõ *cascade08õˆ*cascade08ˆŠ *cascade08Š*cascade08‘ *cascade08‘•*cascade08•– *cascade08–—*cascade08—™ *cascade08™š*cascade08š› *cascade08›«*cascade08«¸ *cascade08¸À*cascade08ÀÈ *cascade08È *cascade08 ¡ *cascade08¡¢*cascade08¢ª *cascade08ª«*cascade08«¬ *cascade08¬­*cascade08­® *cascade08®º*cascade08º» *cascade08»½*cascade08½Á *cascade08ÁÇ*cascade08ÇÈ *cascade08ÈÊ*cascade08ÊÓ *cascade08ÓÛ*cascade08ÛÜ*cascade08Üß*cascade08ßà*cascade08àä*cascade08äó *cascade08óı*cascade08ış *cascade08ş‹*cascade08‹Œ *cascade08Œ*cascade08‘*cascade08‘¨*cascade08¨´ *cascade08´¼*cascade08¼½ *cascade08½À*cascade08ÀÁ *cascade08ÁÅ*cascade08ÅĞ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72›file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/dashboard/layout.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version