•"use client";

/**
 * useEditableState - Simple, stable state for inline editing
 * Key: Minimal state interactions, no circular dependencies
 * ~50 lines
 */

import { useState, useRef, useCallback } from "react";

interface UseEditableStateProps {
    elementId: string;
    selectedElementId: string | null;
    value?: string;
    onValueChange?: (newValue: string) => void;
}

export function useEditableState({ elementId, selectedElementId, value, onValueChange }: UseEditableStateProps) {
    const [isEditing, setIsEditing] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const editableRef = useRef<HTMLElement>(null);
    const originalValueRef = useRef(value);
    const lastTapRef = useRef(0);

    const isSelected = selectedElementId === elementId;

    const startEditing = useCallback(() => {
        originalValueRef.current = value;
        setIsEditing(true);
        // Focus after React render completes
        setTimeout(() => {
            editableRef.current?.focus();
        }, 0);
    }, [value]);

    const cancelEditing = useCallback(() => {
        if (editableRef.current && originalValueRef.current !== undefined) {
            editableRef.current.innerText = originalValueRef.current;
        }
        setIsEditing(false);
    }, []);

    const saveEditing = useCallback(() => {
        if (editableRef.current && onValueChange) {
            const newValue = editableRef.current.innerText.trim();
            if (newValue !== value) {
                onValueChange(newValue);
            }
        }
        setIsEditing(false);
    }, [onValueChange, value]);

    // Get toolbar position (computed, not stored in state)
    const getToolbarPosition = useCallback(() => {
        if (!elementRef.current) return { top: 100, left: 100 };
        const rect = elementRef.current.getBoundingClientRect();
        return {
            top: Math.max(10, rect.top - 45),
            left: Math.max(10, rect.left)
        };
    }, []);

    return {
        isSelected,
        isEditing,
        elementRef,
        editableRef,
        lastTapRef,
        startEditing,
        cancelEditing,
        saveEditing,
        getToolbarPosition,
    };
}
* *cascade08*2*cascade0824 *cascade084;*cascade08;C *cascade08CD*cascade08DE *cascade08EG*cascade08GH *cascade08HI*cascade08IJ *cascade08JL*cascade08LM *cascade08MP*cascade08PT *cascade08TX*cascade08XY *cascade08Y^*cascade08^_ *cascade08_b*cascade08bd *cascade08de*cascade08ef *cascade08fg *cascade08gp*cascade08pq *cascade08qr *cascade08rt*cascade08tu *cascade08u}*cascade08}~ *cascade08~*cascade08Å *cascade08ÅÇ*cascade08ÇÉ *cascade08ÉÑ *cascade08ÑÜ *cascade08Üá*cascade08áà *cascade08àâ *cascade08âç*cascade08çí *cascade08íì*cascade08ìî *cascade08îπ *cascade08π∆*cascade08∆¿ *cascade08¿¬ *cascade08¬∆ *cascade08∆» *cascade08»… *cascade08… *cascade08 À *cascade08ÀÃ*cascade08Ã– *cascade08–—*cascade08—Ÿ *cascade08Ÿ⁄*cascade08⁄„ *cascade08„‰ *cascade08‰Â *cascade08ÂÊ *cascade08ÊË *cascade08ËÍ *cascade08ÍÎ*cascade08Î∞ *cascade08∞º*cascade08ºí *cascade08íô*cascade08ôö *cascade08öú *cascade08ú° *cascade08°ß*cascade08ß® *cascade08®© *cascade08©Æ *cascade08ÆØ*cascade08Ø± *cascade08±≤*cascade08≤¡ *cascade08¡¬*cascade08¬√ *cascade08√∆*cascade08∆  *cascade08 À*cascade08ÀŒ *cascade08Œ”*cascade08”Ù *cascade08Ùı*cascade08ıˆ *cascade08ˆ¯*cascade08¯Ü *cascade08Üá*cascade08áà *cascade08àâ*cascade08âë *cascade08ëõ*cascade08õ∏ *cascade08∏ƒ*cascade08ƒá	 *cascade08á	ï	*cascade08ï	ã
 *cascade08ã
ê
*cascade08ê
´
 *cascade08´
∑
*cascade08∑
⁄ *cascade08⁄Ï*cascade08ÏÑ *cascade08Ñí*cascade08íø *cascade08øÿ*cascade08ÿﬂ *cascade08ﬂ„*cascade08„Â *cascade08ÂÏ*cascade08ÏÌ *cascade08Ìı*cascade08ı˜ *cascade08˜Å*cascade08ÅÇ *cascade08ÇÖ*cascade08ÖÜ *cascade08Üå*cascade08åç *cascade08çè*cascade08èê *cascade08êó*cascade08óõ *cascade08õû*cascade08ûü *cascade08üÆ*cascade08Æ± *cascade08±≤*cascade08≤¥ *cascade08¥∑*cascade08∑∏ *cascade08∏º*cascade08ºø *cascade08ø‰*cascade08‰Â *cascade08Â¸*cascade08¸˛ *cascade08˛Å*cascade08ÅÇ *cascade08Çî*cascade08îï *cascade08ï∑*cascade08∑∏ *cascade08∏ø*cascade08ø¿ *cascade08¿Ô*cascade08Ô *cascade08˚*cascade08˚¸ *cascade08¸Å*cascade08ÅÇ *cascade08Çâ*cascade08âä *cascade08äñ*cascade08ñò *cascade08òû*cascade08û† *cascade08†£*cascade08£§ *cascade08§∞*cascade08∞≤ *cascade08≤≈*cascade08≈« *cascade08«â*cascade08âî *cascade08îú*cascade08ú≤ *cascade08≤¥*cascade08¥∏ *cascade08∏º*cascade08ºΩ *cascade08Ω≈*cascade08≈” *cascade08”€*cascade08€Í *cascade08ÍÚ*cascade08Ú˛ *cascade08˛ö*cascade08ö• *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¢file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/useEditableState.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version