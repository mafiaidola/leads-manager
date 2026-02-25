¿"use client";

/**
 * NavButton - Extracted from TemplateNavigation
 * Uses theme CSS variables for active state
 * ~45 lines
 */

import Link from "next/link";

interface NavItem {
    navId: string;
    pageId: string;
    href: string;
}

interface NavButtonProps {
    item: NavItem;
    isActive: boolean;
    isBuilderMode: boolean;
    onNavClick?: (navId: string, pageId: string) => void;
}

export function NavButton({ item, isActive, isBuilderMode, onNavClick }: NavButtonProps) {
    const baseClass = `px-3 py-1 rounded text-sm font-medium transition-all whitespace-nowrap ${isActive ? "text-white" : "text-gray-300 hover:text-white hover:bg-white/10"}`;

    // Use theme primary color for active state
    const activeStyle: React.CSSProperties = isActive
        ? { backgroundColor: "var(--theme-primary, #E53935)", borderRadius: "var(--theme-border-radius, 4px)" }
        : {};

    if (isBuilderMode) {
        return (
            <button onClick={() => onNavClick?.(item.navId, item.pageId)} className={baseClass} style={activeStyle}>
                {item.navId}
            </button>
        );
    }

    return (
        <Link href={item.href} className={baseClass} style={activeStyle}>
            {item.navId}
        </Link>
    );
}

// Default navigation items
export const defaultNavItems: NavItem[] = [
    { navId: "HOME", pageId: "home", href: "/newlayout1/preview" },
    { navId: "MEN", pageId: "men", href: "/newlayout1/preview/men" },
    { navId: "WOMEN", pageId: "women", href: "/newlayout1/preview/women" },
    { navId: "KIDS", pageId: "kids", href: "/newlayout1/preview/kids" },
    { navId: "SALE", pageId: "sale", href: "/newlayout1/preview/sale" },
    { navId: "ABOUT", pageId: "about", href: "/newlayout1/preview/about" },
    { navId: "CONTACT", pageId: "contact", href: "/newlayout1/preview/contact" },
];
G *cascade08Gt*cascade08tv *cascade08vw*cascade08w≤ *cascade08≤∂∂Ñ *cascade08Ñññ† *cascade08†Ö*cascade08Öâ *cascade08âù*cascade08ù•	 *cascade08•	π	*cascade08π	¿ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72úfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/NavButton.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version