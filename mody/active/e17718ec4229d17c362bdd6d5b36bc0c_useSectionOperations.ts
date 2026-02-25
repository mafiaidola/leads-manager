¼'/**
 * Section Operations - Section CRUD functions
 * Phase H: Updated to use SectionType
 * ~60 lines - AI friendly
 */

import { useCallback } from "react";
import { SectionData, SectionType } from "./types";

export function useSectionOperations(
    currentPageId: string,
    setAllPageSections: React.Dispatch<React.SetStateAction<Record<string, SectionData[]>>>
) {
    // Update sections for current page
    const updateCurrentPageSections = useCallback((updater: (prev: SectionData[]) => SectionData[]) => {
        setAllPageSections(prev => ({
            ...prev,
            [currentPageId]: updater(prev[currentPageId] || []),
        }));
    }, [currentPageId, setAllPageSections]);

    const moveSection = useCallback((id: string, dir: "up" | "down") => {
        updateCurrentPageSections(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (dir === "up" && idx > 1) {
                const newSections = [...prev];
                [newSections[idx - 1], newSections[idx]] = [newSections[idx], newSections[idx - 1]];
                return newSections;
            }
            if (dir === "down" && idx < prev.length - 2) {
                const newSections = [...prev];
                [newSections[idx + 1], newSections[idx]] = [newSections[idx], newSections[idx + 1]];
                return newSections;
            }
            return prev;
        });
    }, [updateCurrentPageSections]);

    const updateSettings = useCallback((id: string, key: string, value: string | number | boolean) => {
        // Special handling for navigation and footer - sync across ALL pages
        const isGlobalSection = (sectionId: string) =>
            sectionId === "nav" || sectionId === "footer";

        if (isGlobalSection(id)) {
            // Update this setting in ALL pages where this section exists
            setAllPageSections(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(pageId => {
                    updated[pageId] = updated[pageId].map(s =>
                        s.id === id ? { ...s, settings: { ...s.settings, [key]: value } } : s
                    );
                });
                return updated;
            });
        } else {
            // Normal per-page update
            updateCurrentPageSections(prev =>
                prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, [key]: value } } : s)
            );
        }
    }, [updateCurrentPageSections, setAllPageSections]);

    const deleteSection = useCallback((id: string) => {
        updateCurrentPageSections(prev => prev.filter(s =>
            s.id !== id || s.type === "navigation" || s.type === "footer"
        ));
    }, [updateCurrentPageSections]);

    const addSection = useCallback((type: SectionType, name: string) => {
        // GUARD: Prevent duplicate footer/navigation
        const isProtectedType = type === "footer" || type === "navigation";
        const protectedExists = (sections: SectionData[]) =>
            sections.some(s => s.type === type);

        // Check in current page sections before adding
        setAllPageSections(prev => {
            const currentSections = prev[currentPageId] || [];
            if (isProtectedType && protectedExists(currentSections)) {
                // Return unchanged - duplicate prevented (toast shown separately)
                return prev;
            }

            // Create display-friendly name
            const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
            const newSection: SectionData = {
                id: `${type}-${Date.now()}`,
                type,
                name: displayName,
                settings: { title: displayName, subtitle: "" },
            };

            // Insert before footer if exists
            const footerIdx = currentSections.findIndex(s => s.type === "footer");
            let newList: SectionData[];
            if (footerIdx > 0) {
                newList = [...currentSections];
                newList.splice(footerIdx, 0, newSection);
            } else {
                newList = [...currentSections, newSection];
            }

            return { ...prev, [currentPageId]: newList };
        });
    }, [currentPageId, setAllPageSections]);

    // Reorder section from one index to another (for drag-drop)
    const reorderSection = useCallback((fromIndex: number, toIndex: number) => {
        updateCurrentPageSections(prev => {
            if (fromIndex === toIndex || fromIndex < 1 || toIndex < 1 ||
                fromIndex >= prev.length - 1 || toIndex >= prev.length - 1) {
                return prev;
            }
            const newSections = [...prev];
            const [removed] = newSections.splice(fromIndex, 1);
            newSections.splice(toIndex, 0, removed);
            return newSections;
        });
    }, [updateCurrentPageSections]);

    return { moveSection, updateSettings, deleteSection, addSection, reorderSection };
}
¥ *cascade08¥‘*cascade08‘³ *cascade08³´*cascade08´À *cascade08ÀÃ*cascade08Ãì *cascade08ìğ*cascade08ğ‚ *cascade08‚†*cascade08†Š *cascade08Š—*cascade08—™ *cascade08™*cascade08¼ *cascade08¼Ä*cascade08Äá *cascade08áå*cascade08åè *cascade08èê*cascade08êò *cascade08òû*cascade08ûı *cascade08ıƒ*cascade08ƒ… *cascade08…‰*cascade08‰‹ *cascade08‹*cascade08‘ *cascade08‘”*cascade08”µ *cascade08µ¸*cascade08¸º *cascade08ºÄ*cascade08Äö *cascade08ö*cascade08Æ *cascade08ÆÇ*cascade08ÇÉ *cascade08ÉÊ*cascade08ÊÑ *cascade08ÑÔ*cascade08ÔÖ *cascade08Öà*cascade08àö *cascade08ö÷*cascade08÷ù *cascade08ùú*cascade08ú©  *cascade08© ª *cascade08ª «  *cascade08« ¯ *cascade08¯ °  *cascade08° ² *cascade08² ´  *cascade08´ Ã *cascade08Ã Ä  *cascade08Ä È *cascade08È É  *cascade08É Ñ *cascade08Ñ Ó  *cascade08Ó Õ *cascade08Õ Ö  *cascade08Ö à *cascade08à ë  *cascade08ë ì *cascade08ì û  *cascade08û ü *cascade08ü ! *cascade08!’!*cascade08’!›! *cascade08›!¬!*cascade08¬!¯! *cascade08¯!²!*cascade08²!³! *cascade08³!µ!*cascade08µ!Ë! *cascade08Ë!Ì!*cascade08Ì!Ò! *cascade08Ò!à!*cascade08à!¼' *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72®file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/useSectionOperations.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version