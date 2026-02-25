�/**
 * API Data Converter
 * Converts between API format and mockup format
 * ~45 lines
 */

import { SectionData, PageData, SectionType } from "../types";
import { ThemeSettings, defaultTheme } from "../theme";
import { MockupBuilderState } from "../storage";
import { APIResponse } from "./types";

// Convert API response to mockup state
export function apiToMockupState(json: APIResponse): MockupBuilderState | null {
    if (!json.success || !json.data) return null;

    const vbData = json.data.visualBuilderData;

    const pages: PageData[] = (vbData?.pages || []).map(p => ({
        id: p.id,
        name: p.name,
        nameAr: p.name, // Default
        slug: p.slug,
    }));

    const allPageSections: Record<string, SectionData[]> = {};
    (vbData?.pages || []).forEach(p => {
        allPageSections[p.id] = (p.elements || []).map(e => ({
            id: e.id,
            type: e.type as SectionType,
            name: e.type.charAt(0).toUpperCase() + e.type.slice(1),
            settings: e.props || {},
        }));
    });

    const theme: ThemeSettings = {
        ...defaultTheme,
        primaryColor: vbData?.settings?.primaryColor || defaultTheme.primaryColor,
        fontFamily: vbData?.settings?.fontFamily || defaultTheme.fontFamily,
    };

    const defaultPages: PageData[] = [{ id: "home", name: "Home", nameAr: "الرئيسية" }];

    return {
        pages: pages.length > 0 ? pages : defaultPages,
        allPageSections,
        theme,
        currentPageId: "home",
        savedAt: json.data.savedAt || new Date().toISOString(),
    };
}
�*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/api/converter.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version