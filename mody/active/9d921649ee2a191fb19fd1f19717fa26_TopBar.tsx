� "use client";

/**
 * TopBar - Fixed Header Architecture
 * 
 * ⚠️ CRITICAL: Do NOT remove dir="ltr" from header - it prevents RTL flipping
 * ⚠️ CRITICAL: Menu button position is INTENTIONALLY different per language
 * 
 * See DESIGN_RULES.md for full documentation
 * 
 * Rules:
 * - Header: dir="ltr" (NEVER change this)
 * - Logo: Always LEFT
 * - Controls: Always RIGHT
 * - Menu button: LEFT for English (sidebar opens left), RIGHT for Arabic (sidebar opens right)
 */

import Link from "next/link";
import { Language, Theme, translations } from "./types";
import { DashboardTab } from "./Sidebar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { ProfileDropdown } from "./ProfileDropdown";

interface TopBarProps {
    onMenuToggle: () => void;
    mobileMenuOpen: boolean;
    language: Language;
    theme: Theme;
    onLanguageChange: (lang: Language) => void;
    onThemeChange: (theme: Theme) => void;
    onTabChange?: (tab: DashboardTab, section?: string) => void;
    onLogout?: () => void;
    onResetOnboarding?: () => void;
}

export function TopBar({ onMenuToggle, mobileMenuOpen, language, theme, onLanguageChange, onThemeChange, onTabChange, onLogout, onResetOnboarding }: TopBarProps) {
    const t = translations[language];
    const isArabic = language === "ar";

    // Menu button component (reused in different positions based on language)
    const MenuButton = (
        <button onClick={onMenuToggle} className="lg:hidden text-2xl p-2 rounded-xl hover:bg-gray-100" style={{ color: "var(--text-primary)" }}>
            {mobileMenuOpen ? "✕" : "☰"}
        </button>
    );

    return (
        <header dir="ltr" className="fixed top-0 left-0 right-0 h-16 z-50 shadow-sm border-b" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="h-full flex items-center justify-between px-4 lg:px-6">
                {/* LEFT: Menu (English only) + Logo */}
                <div className="flex items-center gap-3">
                    {!isArabic && MenuButton}
                    {/* Logo stays in dashboard - does NOT link to marketing page */}
                    <Link href="/newlayout1" className="flex items-center gap-2">
                        <span className="text-2xl">🛍️</span>
                        <span className="font-bold text-xl hidden sm:block" style={{ color: "var(--text-primary)" }}>Egybag</span>
                    </Link>
                </div>

                {/* CENTER: Search */}
                <div className="flex-1 max-w-md mx-4 hidden md:block">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                        <input type="text" placeholder={t.search} className="w-full py-2.5 pl-12 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-primary)" }} />
                    </div>
                </div>

                {/* RIGHT: Controls + Menu (Arabic only) */}
                <div className="flex items-center gap-2">
                    <button onClick={() => onLanguageChange(language === "en" ? "ar" : "en")} className="p-2 rounded-xl flex items-center gap-1 hover:bg-gray-100" style={{ color: "var(--text-secondary)" }}>
                        <span className="text-lg">{language === "en" ? "🇺🇸" : "🇸🇦"}</span>
                        <span className="hidden sm:inline text-sm font-medium">{language.toUpperCase()}</span>
                    </button>
                    <button onClick={() => onThemeChange(theme === "light" ? "dark" : "light")} className="p-2 rounded-xl hover:bg-gray-100">
                        <span className="text-xl">{theme === "light" ? "🌙" : "☀️"}</span>
                    </button>
                    <NotificationsDropdown language={language} />
                    <ProfileDropdown language={language} onTabChange={onTabChange} onLogout={onLogout} onResetOnboarding={onResetOnboarding} />
                    {isArabic && MenuButton}
                </div>
            </div>
        </header>
    );
}
� *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/TopBar.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version