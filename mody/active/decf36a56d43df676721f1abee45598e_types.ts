º/**
 * Builder API Types
 * Shared types for builder API operations
 * ~25 lines
 */

import { SectionData, PageData } from "../types";
import { ThemeSettings } from "../theme";
import { MockupBuilderState } from "../storage";

export interface BuilderAPIState {
    loading: boolean;
    saving: boolean;
    publishing: boolean;
    error: string | null;
    lastSaved: string | null;
    lastPublished: string | null;
}

export interface APIResponse {
    success: boolean;
    error?: string;
    data?: {
        visualBuilderData?: {
            pages?: Array<{
                id: string;
                name: string;
                slug: string;
                elements?: Array<{
                    id: string;
                    type: string;
                    props: Record<string, unknown>;
                }>;
            }>;
            settings?: {
                primaryColor?: string;
                fontFamily?: string;
            };
        };
        savedAt?: string;
    };
}

export type { SectionData, PageData, ThemeSettings, MockupBuilderState };
º*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72£file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/api/types.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version