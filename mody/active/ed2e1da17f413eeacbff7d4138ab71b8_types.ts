à	/**
 * BuilderCanvas types
 * ~30 lines
 */

import { SectionData } from "../useBuilderState";
import { DevicePreviewMode } from "../../BuilderModeContext";
import { ThemeSettings } from "../theme/types";

export interface BuilderCanvasProps {
    sections: SectionData[];
    selectedId: string | null;
    currentPageId: string;
    activeNavId: string;
    pages: { id: string; name: string }[];
    onNavClick: (navId: string, pageId: string) => void;
    onSelect: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onDelete: (id: string) => void;
    onImagePick: (id: string) => void;
    onDuplicate?: (id: string) => void;
    canvasWidth: string;
    deviceMode?: DevicePreviewMode;
    onUpdateSettings: (sectionId: string, key: string, value: string | number | boolean) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onSectionDrop?: (sectionType: string) => void;
    selectedElementId?: string | null;
    hoveredElementId?: string | null;
    onElementSelect?: (elementId: string | null) => void;
    onElementHover?: (elementId: string | null) => void;
    subdomain?: string;
    /** Theme settings for styling the preview */
    theme?: ThemeSettings;
}
à	*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72®file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/builder-canvas/types.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version