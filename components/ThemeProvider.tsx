"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";

type Theme = "violet" | "ocean" | "emerald";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "violet",
    setTheme: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({
    children,
    initialTheme = "violet",
}: {
    children: ReactNode;
    initialTheme?: Theme;
}) {
    const [theme, setTheme] = useState<Theme>(initialTheme);

    useEffect(() => {
        const root = document.documentElement;
        // Remove all theme classes
        root.classList.remove("theme-violet", "theme-ocean", "theme-emerald");
        // Add current theme class (violet is the default, so we only add non-default)
        if (theme !== "violet") {
            root.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
