Ü"use client";

/**
 * Save/Load State Hook
 * ~85 lines - AI friendly
 */

import { useState, useCallback, useEffect } from "react";
import { SectionData, PageData } from "../types";
import { ThemeSettings } from "../theme";
import { saveToLocalStorage, loadFromLocalStorage, exportToVisualBuilder, MockupBuilderState } from "./index";
import { syncGlobalSections } from "./syncGlobalSections";
import { saveToAPI, publishToAPI } from "./apiOperations";

interface UseSaveStateOptions {
    pages: PageData[];
    allPageSections: Record<string, SectionData[]>;
    theme: ThemeSettings;
    currentPageId: string;
    subdomain?: string;
    storeId?: string | null;
    autoSave?: boolean;
    autoSaveDelay?: number;
}

export function useSaveState(options: UseSaveStateOptions) {
    const { pages, allPageSections, theme, currentPageId, subdomain, storeId, autoSave = true, autoSaveDelay = 30000 } = options;

    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const save = useCallback(async () => {
        setIsSaving(true);
        const startTime = Date.now();
        const success = storeId
            ? await saveToAPI(storeId, pages, allPageSections, theme)
            : saveToLocalStorage({ pages, allPageSections, theme, currentPageId, subdomain });
        const elapsed = Date.now() - startTime;
        if (elapsed < 400) await new Promise(r => setTimeout(r, 400 - elapsed));
        if (success) { setLastSaved(new Date()); setIsDirty(false); }
        setIsSaving(false);
        return success;
    }, [pages, allPageSections, theme, currentPageId, subdomain, storeId]);

    const publish = useCallback(async () => {
        if (!storeId) return false;
        setIsPublishing(true);
        const success = await publishToAPI(storeId, pages, allPageSections, theme);
        setIsPublishing(false);
        return success;
    }, [pages, allPageSections, theme, storeId]);

    const exportData = useCallback(() => exportToVisualBuilder(pages, allPageSections, theme), [pages, allPageSections, theme]);

    useEffect(() => { setIsDirty(true); }, [pages, allPageSections, theme, currentPageId, subdomain]);

    useEffect(() => {
        if (!autoSave || !isDirty) return;
        const timer = setTimeout(save, autoSaveDelay);
        return () => clearTimeout(timer);
    }, [autoSave, autoSaveDelay, isDirty, save]);

    return { save, publish, exportData, lastSaved, isSaving, isDirty, isPublishing, isApiMode: !!storeId };
}

// Load initial state helper
export function loadInitialState(): MockupBuilderState | null {
    if (typeof window === "undefined") return null;
    const state = loadFromLocalStorage();
    if (state?.allPageSections) state.allPageSections = syncGlobalSections(state.allPageSections);
    return state;
}

/ *cascade08/1*cascade081– *cascade08–ãã∆*cascade08∆ˇ *cascade08ˇõ *cascade08õõ*cascade08õú *cascade08ú’ *cascade08’ﬁ*cascade08ﬁ¬ *cascade08¬«*cascade08«» *cascade08»Ã*cascade08ÃÕ *cascade08ÕŒ*cascade08Œ– *cascade08–—*cascade08—‘ *cascade08‘÷*cascade08÷ÿ *cascade08ÿ›*cascade08›ﬁ *cascade08ﬁﬂ*cascade08ﬂ‡ *cascade08‡Á*cascade08ÁË *cascade08ËÏ*cascade08ÏÌ *cascade08ÌÒ*cascade08ÒÚ *cascade08ÚÙ*cascade08Ùı *cascade08ı¸ *cascade08¸	 *cascade08	Ù	*cascade08Ù	î
 *cascade08î
ï
*cascade08ï
ó
 *cascade08ó
ò
*cascade08ò
ö
 *cascade08ö
õ
*cascade08õ
û
 *cascade08û
ü
*cascade08ü
†
 *cascade08†
¢
*cascade08¢
•
 *cascade08•
ß
*cascade08ß
®
 *cascade08®
©
 *cascade08©
´
 *cascade08´
¨
*cascade08¨
≠
 *cascade08≠
Ø
*cascade08Ø
‹
 *cascade08‹
Á *cascade08Áˆ *cascade08ˆ˜*cascade08˜Ü *cascade08Üá*cascade08áâ *cascade08âë*cascade08ëö *cascade08öù*cascade08ùû *cascade08û†*cascade08†° *cascade08°§*cascade08§¶ *cascade08¶ß*cascade08ß® *cascade08®©*cascade08©≥ *cascade08≥¥*cascade08¥µ *cascade08µ∂*cascade08∂† *cascade08†ˆ *cascade08ˆˇ *cascade08ˇ® *cascade08®Ã *cascade08ÃË *cascade08ËÍÍÎ *cascade08Îııå *cascade08
åõ õú*cascade08
úÅ ÅÑ *cascade08ÑÖ*cascade08ÖÜ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72Æfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/storage/useSaveState.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version