‰"use client";

/**
 * Theme Context - Provides theme settings throughout the preview/canvas
 * Includes CSS variables injection and Google Fonts loading
 * ~90 lines - AI friendly
 */

import { createContext, useContext, ReactNode, useEffect, useMemo } from "react";
import { ThemeSettings, defaultTheme } from "./builder/theme/types";

interface ThemeContextType {
    theme: ThemeSettings;
    cssVariables: React.CSSProperties;
}

const defaultCssVariables: React.CSSProperties = {
    "--theme-primary": defaultTheme.primaryColor,
    "--theme-secondary": defaultTheme.secondaryColor,
    "--theme-accent": defaultTheme.accentColor,
    "--theme-text": defaultTheme.textColor,
    "--theme-background": defaultTheme.backgroundColor,
    "--theme-font": defaultTheme.fontFamily,
    "--theme-heading-font": defaultTheme.headingFont,
} as React.CSSProperties;

const ThemeContext = createContext<ThemeContextType>({
    theme: defaultTheme,
    cssVariables: defaultCssVariables,
});

export function useTheme() {
    return useContext(ThemeContext);
}

interface ThemeProviderProps {
    children: ReactNode;
    theme?: ThemeSettings;
}

// Border radius mapping
const borderRadiusMap: Record<string, string> = {
    none: "0px",
    small: "4px",
    medium: "8px",
    large: "16px",
};

// Spacing mapping
const spacingMap: Record<string, string> = {
    compact: "0.75rem",
    normal: "1rem",
    relaxed: "1.5rem",
};

export function ThemeProvider({ children, theme = defaultTheme }: ThemeProviderProps) {
    // Build CSS variables from theme
    const cssVariables = useMemo<React.CSSProperties>(() => ({
        "--theme-primary": theme.primaryColor,
        "--theme-secondary": theme.secondaryColor,
        "--theme-accent": theme.accentColor,
        "--theme-text": theme.textColor,
        "--theme-background": theme.backgroundColor,
        "--theme-font": theme.fontFamily,
        "--theme-heading-font": theme.headingFont,
        "--theme-border-radius": borderRadiusMap[theme.borderRadius] || "8px",
        "--theme-spacing": spacingMap[theme.spacing] || "1rem",
    } as React.CSSProperties), [theme]);

    // Load Google Fonts dynamically
    useEffect(() => {
        const fonts = [theme.fontFamily, theme.headingFont].filter((f, i, arr) => arr.indexOf(f) === i);
        const fontsToLoad = fonts.filter(f => f && f !== "System" && f !== "inherit");

        if (fontsToLoad.length === 0) return;

        const linkId = "dynamic-google-fonts";
        let link = document.getElementById(linkId) as HTMLLinkElement | null;

        // Build Google Fonts URL
        const fontFamilies = fontsToLoad.map(f => `family=${f.replace(/\s+/g, "+")}:wght@400;500;600;700`).join("&");
        const href = `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;

        if (!link) {
            link = document.createElement("link");
            link.id = linkId;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }

        link.href = href;
    }, [theme.fontFamily, theme.headingFont]);

    return (
        <ThemeContext.Provider value={{ theme, cssVariables }}>
            {children}
        </ThemeContext.Provider>
    );
}
‰*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72Ÿfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/ThemeContext.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version