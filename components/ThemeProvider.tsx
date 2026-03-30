/**
 * @component ThemeProvider
 * @description React context provider for theme management.
 * Handles two dimensions:
 * 1. Color theme: violet (default), ocean, emerald
 * 2. Appearance mode: dark (default), light, system
 * 
 * Persists both preferences to localStorage and syncs with 
 * CSS classes on `<html>` element.
 */
"use client";

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from "react";

type Theme = "violet" | "ocean" | "emerald";
type Mode = "dark" | "light" | "system";

interface ThemeContextValue {
    theme: Theme;
    mode: Mode;
    resolvedMode: "dark" | "light";
    setTheme: (theme: Theme) => void;
    setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "violet",
    mode: "dark",
    resolvedMode: "dark",
    setTheme: () => { },
    setMode: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

function getSystemMode(): "dark" | "light" {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
    children,
    initialTheme = "violet",
}: {
    children: ReactNode;
    initialTheme?: Theme;
}) {
    const [theme, setThemeState] = useState<Theme>(initialTheme);
    const [mode, setModeState] = useState<Mode>("light");
    const [resolvedMode, setResolvedMode] = useState<"dark" | "light">("light");

    // Initialize mode from localStorage (theme comes from server via initialTheme)
    useEffect(() => {
        const savedMode = localStorage.getItem("appearance-mode") as Mode | null;
        if (savedMode && ["dark", "light", "system"].includes(savedMode)) {
            setModeState(savedMode);
        }
    }, []);

    // Apply color theme class
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("theme-violet", "theme-ocean", "theme-emerald");
        if (theme !== "violet") {
            root.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    // Apply appearance mode class
    useEffect(() => {
        const root = document.documentElement;
        const resolved = mode === "system" ? getSystemMode() : mode;
        setResolvedMode(resolved);

        if (resolved === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.remove("dark");
            root.classList.add("light");
        }
    }, [mode]);

    // Listen for system theme changes when mode is "system"
    useEffect(() => {
        if (mode !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? "dark" : "light";
            setResolvedMode(resolved);
            const root = document.documentElement;
            if (resolved === "dark") {
                root.classList.add("dark");
                root.classList.remove("light");
            } else {
                root.classList.remove("dark");
                root.classList.add("light");
            }
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [mode]);

    // Update theme when server prop changes (admin changes theme)
    useEffect(() => {
        setThemeState(initialTheme);
    }, [initialTheme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
    }, []);

    const setMode = useCallback((m: Mode) => {
        setModeState(m);
        localStorage.setItem("appearance-mode", m);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, mode, resolvedMode, setTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}
