ï"use client";

/**
 * Builder API Hook - Connect to Visual Builder API
 * ~75 lines - AI friendly
 */

import { useState, useCallback } from "react";
import { PageData, SectionData } from "../types";
import { ThemeSettings } from "../theme";
import { exportToVisualBuilder, MockupBuilderState } from "../storage";
import { BuilderAPIState } from "./types";
import { apiToMockupState } from "./converter";

export function useBuilderAPI(storeId: string | null) {
    const [state, setState] = useState<BuilderAPIState>({
        loading: false, saving: false, publishing: false,
        error: null, lastSaved: null, lastPublished: null,
    });

    const loadFromAPI = useCallback(async (): Promise<MockupBuilderState | null> => {
        if (!storeId) return null;
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const res = await fetch(`/api/visual-builder/${storeId}`);
            const json = await res.json();
            setState(s => ({ ...s, loading: false, error: json.success ? null : json.error }));
            return apiToMockupState(json);
        } catch (err) {
            console.error("[Builder API] Load error:", err);
            setState(s => ({ ...s, loading: false, error: "Network error" }));
            return null;
        }
    }, [storeId]);

    const saveToAPI = useCallback(async (
        pages: PageData[], allPageSections: Record<string, SectionData[]>, theme: ThemeSettings
    ): Promise<boolean> => {
        if (!storeId) return false;
        setState(s => ({ ...s, saving: true, error: null }));
        try {
            const visualBuilderData = exportToVisualBuilder(pages, allPageSections, theme);
            const res = await fetch(`/api/visual-builder/${storeId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visualBuilderData, theme }),
            });
            const json = await res.json();
            setState(s => ({ ...s, saving: false, lastSaved: json.success ? new Date().toISOString() : null, error: json.success ? null : json.error }));
            return json.success;
        } catch (err) {
            setState(s => ({ ...s, saving: false, error: "Network error" }));
            return false;
        }
    }, [storeId]);

    const publishToAPI = useCallback(async (
        pages: PageData[], allPageSections: Record<string, SectionData[]>, theme: ThemeSettings
    ): Promise<boolean> => {
        if (!storeId) return false;
        setState(s => ({ ...s, publishing: true, error: null }));
        try {
            const visualBuilderData = exportToVisualBuilder(pages, allPageSections, theme);
            const res = await fetch(`/api/visual-builder/${storeId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visualBuilderData }),
            });
            const json = await res.json();
            setState(s => ({ ...s, publishing: false, lastPublished: json.success ? new Date().toISOString() : null, error: json.success ? null : json.error }));
            return json.success;
        } catch (err) {
            setState(s => ({ ...s, publishing: false, error: "Network error" }));
            return false;
        }
    }, [storeId]);

    return { ...state, loadFromAPI, saveToAPI, publishToAPI, hasStoreId: !!storeId };
}
ï*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72«file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/api/useBuilderAPI.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version