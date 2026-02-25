Õ."use client";

/**
 * BuilderCanvas - Main canvas component
 * Composed from smaller focused components
 * 
 * IMPORTANT: Uses PortalProvider to ensure all modals/dropdowns
 * render INSIDE the canvas preview, not in document.body
 * 
 * SCROLL BEHAVIOR:
 * - Canvas has overflow-y-auto so scroll stays INSIDE
 * - Mobile preview has max-height constraint
 * - Browser scrollbar should NEVER appear from canvas content
 * 
 * THEME: Wrapped with ThemeProvider for global theme colors/fonts
 * 
 * ~80 lines
 */

import { useRef } from "react";
import { BuilderCanvasProps } from "./types";
import { BrowserChrome } from "./BrowserChrome";
import { SectionList } from "./SectionList";
import { useSectionDrag } from "../useSectionDrag";
import { CartProvider } from "../../CartProvider";
import { BuilderModeProvider } from "../../BuilderModeContext";
import { PortalProvider } from "../../PortalContext";
import { ThemeProvider, useTheme } from "../../ThemeContext";

export function BuilderCanvas({
    sections, selectedId, currentPageId, activeNavId, pages, onNavClick,
    onSelect, onMoveUp, onMoveDown, onDelete, onImagePick, onDuplicate,
    canvasWidth, deviceMode = "desktop", onUpdateSettings, onReorder,
    onSectionDrop, selectedElementId, hoveredElementId, onElementSelect,
    onElementHover, subdomain = "luxe-kicks", theme,
}: BuilderCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { dragState, handleDragStart, handleDragOver, handleDragEnd, handleDragLeave } = useSectionDrag({
        sections,
        onReorder: onReorder || (() => { }),
    });

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const sectionType = e.dataTransfer.getData("sectionType");
        if (sectionType && onSectionDrop) onSectionDrop(sectionType);
    };

    // Mobile preview: limit height so scroll stays inside canvas
    const isMobile = deviceMode === "mobile" || deviceMode === "tablet";

    return (
        <ThemeProvider theme={theme}>
            <CanvasContent
                canvasRef={canvasRef}
                scrollContainerRef={scrollContainerRef}
                canvasWidth={canvasWidth}
                isMobile={isMobile}
                handleCanvasDrop={handleCanvasDrop}
                subdomain={subdomain}
                deviceMode={deviceMode}
                currentPageId={currentPageId}
                activeNavId={activeNavId}
                onNavClick={onNavClick}
                pages={pages}
                selectedElementId={selectedElementId}
                hoveredElementId={hoveredElementId}
                onElementSelect={onElementSelect}
                onElementHover={onElementHover}
                sections={sections}
                selectedId={selectedId}
                dragState={dragState}
                onSelect={onSelect}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onImagePick={onImagePick}
                onUpdateSettings={onUpdateSettings}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDragEnd={handleDragEnd}
                handleDragLeave={handleDragLeave}
            />
        </ThemeProvider>
    );
}

// Inner component to access theme context
function CanvasContent({
    canvasRef, scrollContainerRef, canvasWidth, isMobile,
    handleCanvasDrop, subdomain, deviceMode, currentPageId, activeNavId,
    onNavClick, pages, selectedElementId, hoveredElementId, onElementSelect,
    onElementHover, sections, selectedId, dragState, onSelect, onMoveUp,
    onMoveDown, onDelete, onDuplicate, onImagePick, onUpdateSettings,
    handleDragStart, handleDragOver, handleDragEnd, handleDragLeave,
}: any) {
    const { cssVariables } = useTheme();

    return (
        <div
            ref={canvasRef}
            className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 mx-auto transition-all flex flex-col"
            style={{
                maxWidth: canvasWidth,
                maxHeight: isMobile ? "calc(100vh - 140px)" : undefined,
                ...cssVariables,
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
        >
            <BrowserChrome subdomain={subdomain} />
            {/* Scrollable content container - scroll stays INSIDE canvas */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{ fontFamily: `var(--theme-font), system-ui, sans-serif` }}
            >
                <PortalProvider containerRef={canvasRef}>
                    <BuilderModeProvider isBuilderMode={true} deviceMode={deviceMode} currentPageId={currentPageId} activeNavId={activeNavId} onNavClick={onNavClick} pages={pages} selectedElementId={selectedElementId} hoveredElementId={hoveredElementId} onElementSelect={onElementSelect} onElementHover={onElementHover}>
                        <CartProvider>
                            <SectionList
                                sections={sections} selectedId={selectedId} dragState={dragState}
                                onSelect={onSelect} onMoveUp={onMoveUp} onMoveDown={onMoveDown}
                                onDelete={onDelete} onDuplicate={onDuplicate}
                                onImagePick={onImagePick} onUpdateSettings={onUpdateSettings}
                                onDragStart={handleDragStart} onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd} onDragLeave={handleDragLeave}
                            />
                        </CartProvider>
                    </BuilderModeProvider>
                </PortalProvider>
            </div>
        </div>
    );
}
Õ.*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72·file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/builder-canvas/BuilderCanvas.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version