ù"use client";

/**
 * Initial Load Hook
 * Handles loading builder state from API or localStorage
 * ~60 lines - AI friendly
 */

import { useState, useEffect } from "react";
import { PageData, SectionData } from "./types";
import { ThemeSettings } from "./theme";
import { loadInitialState } from "./storage/useSaveState";
import { apiToMockupState } from "./api/converter";

interface UseInitialLoadOptions {
    storeId: string | null;
    onLoad: (pages: PageData[], sections: Record<string, SectionData[]>, pageId: string) => void;
    onThemeLoad: (theme: ThemeSettings) => void;
    onSubdomainLoad: (subdomain: string) => void;
}

export function useInitialLoad({ storeId, onLoad, onThemeLoad, onSubdomainLoad }: UseInitialLoadOptions) {
    const [isLoading, setIsLoading] = useState(!!storeId);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (storeId) {
                // API mode: load from Supabase
                setIsLoading(true);
                setLoadError(null);
                try {
                    const res = await fetch(`/api/visual-builder/${storeId}`, { credentials: "include" });
                    const json = await res.json();
                    const state = apiToMockupState(json);
                    if (state) {
                        onLoad(state.pages, state.allPageSections, state.currentPageId);
                        onThemeLoad(state.theme);
                        // Load subdomain if available from store data
                        if (json.data?.subdomain) onSubdomainLoad(json.data.subdomain);
                    } else if (!json.success) {
                        setLoadError(json.error || "Failed to load");
                    }
                    // If no data yet (new store), just use defaults (don't set error)
                } catch {
                    setLoadError("Network error");
                }
                setIsLoading(false);
            } else {
                // Local mode: load from localStorage
                const saved = loadInitialState();
                if (saved) {
                    onLoad(saved.pages, saved.allPageSections, saved.currentPageId);
                    onThemeLoad(saved.theme);
                    if (saved.subdomain) {
                        onSubdomainLoad(saved.subdomain);
                        try { window.history.replaceState({}, "", `?subdomain=${saved.subdomain}`); } catch { }
                    }
                }
            }
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeId]);

    return { isLoading, loadError };
}
f *cascade08fh*cascade08hâ *cascade08âù *cascade08ù¥ *cascade08¥¡*cascade08¡ƒ *cascade08ƒ¯*cascade08¯ù	 *cascade08ù	π	*cascade08π	É
 *cascade08É
Ñ
*cascade08Ñ
á
 *cascade08á
à
*cascade08à
ä
 *cascade08ä
ã
*cascade08ã
ç
 *cascade08ç
ë
*cascade08ë
í
 *cascade08í
ì
*cascade08ì
î
 *cascade08î
ö
*cascade08ö
õ
 *cascade08õ
û
*cascade08û
ü
 *cascade08ü
Ω
*cascade08Ω
æ
 *cascade08æ
√
*cascade08√
≈
 *cascade08≈
∆
*cascade08∆
‚
 *cascade08‚
Â
*cascade08Â
Ê
 *cascade08Ê
Ï
*cascade08Ï
Ó
 *cascade08Ó
ı
*cascade08ı
ˆ
 *cascade08ˆ
˝
*cascade08˝
ˇ
 *cascade08ˇ
Ö*cascade08ÖÜ *cascade08Üá*cascade08áã *cascade08ãå*cascade08åç *cascade08çè*cascade08èê *cascade08êì*cascade08ìï *cascade08ïô*cascade08ôö *cascade08öõ*cascade08õú *cascade08úù*cascade08ùû *cascade08û£*cascade08£§ *cascade08§¨*cascade08¨≠ *cascade08≠ª*cascade08ªΩ *cascade08Ωø*cascade08ø¿ *cascade08¿ *cascade08 Ã *cascade08Ã‘*cascade08‘ *cascade08Ò*cascade08ÒÚ *cascade08ÚÙ*cascade08Ùˆ *cascade08ˆ˘*cascade08˘˙ *cascade08˙˛*cascade08˛ˇ *cascade08ˇÅ*cascade08ÅÉ *cascade08ÉÑ*cascade08ÑÖ *cascade08ÖÜ*cascade08Üà *cascade08àâ*cascade08âä *cascade08äé*cascade08éè *cascade08èê*cascade08êë *cascade08ëï*cascade08ïö *cascade08öõ*cascade08õ¥ *cascade08¥π*cascade08π∫ *cascade08∫ø*cascade08ø¿ *cascade08¿«*cascade08«» *cascade08»…*cascade08…  *cascade08 ”*cascade08”‘ *cascade08‘⁄*cascade08⁄€ *cascade08€›*cascade08›ﬁ *cascade08ﬁ·*cascade08·‚ *cascade08‚È*cascade08ÈÍ *cascade08ÍÒ*cascade08Òé *cascade08é°*cascade08°ˇ *cascade08ˇ÷*cascade08÷ù *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72®file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/useInitialLoad.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version