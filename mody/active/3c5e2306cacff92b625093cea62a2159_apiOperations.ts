Þ/**
 * API Save/Publish Functions
 * Extracted from useSaveState for file size compliance
 * ~45 lines
 */

import { PageData, SectionData } from "../types";
import { ThemeSettings } from "../theme";
import { exportToVisualBuilder } from "./index";

// Save to API
export async function saveToAPI(
    storeId: string,
    pages: PageData[],
    allPageSections: Record<string, SectionData[]>,
    theme: ThemeSettings
): Promise<boolean> {
    try {
        const visualBuilderData = exportToVisualBuilder(pages, allPageSections, theme);
        const res = await fetch(`/api/visual-builder/${storeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visualBuilderData, theme }),
        });
        const json = await res.json();
        return json.success;
    } catch (err) {
        console.error("[Save] API error:", err);
        return false;
    }
}

// Publish to API
export async function publishToAPI(
    storeId: string,
    pages: PageData[],
    allPageSections: Record<string, SectionData[]>,
    theme: ThemeSettings
): Promise<boolean> {
    try {
        const visualBuilderData = exportToVisualBuilder(pages, allPageSections, theme);
        const res = await fetch(`/api/visual-builder/${storeId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visualBuilderData }),
        });
        const json = await res.json();
        return json.success;
    } catch (err) {
        console.error("[Publish] API error:", err);
        return false;
    }
}
Þ*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¯file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/storage/apiOperations.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version