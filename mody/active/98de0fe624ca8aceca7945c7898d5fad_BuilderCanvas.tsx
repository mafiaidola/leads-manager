¯("use client";

/**
 * Builder Canvas - Renders sections with drag-drop support
 * ~90 lines - Refactored: SectionRenderer extracted
 */

import { SectionData } from "./useBuilderState";
import { EditableSection } from "./EditableSection";
import { useSectionDrag } from "./useSectionDrag";
import { SectionRenderer } from "./SectionRenderer";
import { CartProvider } from "../CartProvider";
import { BuilderModeProvider, DevicePreviewMode } from "../BuilderModeContext";

interface BuilderCanvasProps {
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
    onAIAssist: (id: string) => void;
    onImagePick: (id: string) => void;
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
}

export function BuilderCanvas({
    sections, selectedId, currentPageId, activeNavId, pages, onNavClick,
    onSelect, onMoveUp, onMoveDown, onDelete, onAIAssist, onImagePick,
    canvasWidth, deviceMode = "desktop", onUpdateSettings, onReorder,
    onSectionDrop, selectedElementId, hoveredElementId, onElementSelect,
    onElementHover, subdomain = "luxe-kicks",
}: BuilderCanvasProps) {
    const { dragState, handleDragStart, handleDragOver, handleDragEnd, handleDragLeave } = useSectionDrag({
        sections,
        onReorder: onReorder || (() => { }),
    });

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const sectionType = e.dataTransfer.getData("sectionType");
        if (sectionType && onSectionDrop) onSectionDrop(sectionType);
    };

    return (
        <div
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 mx-auto transition-all"
            style={{ maxWidth: canvasWidth }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
        >
            {/* Browser chrome */}
            <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-2">
                    <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 text-center truncate">{subdomain}.egybag.store</div>
                </div>
            </div>

            {/* Template content */}
            <BuilderModeProvider isBuilderMode={true} deviceMode={deviceMode} currentPageId={currentPageId} activeNavId={activeNavId} onNavClick={onNavClick} pages={pages} selectedElementId={selectedElementId} hoveredElementId={hoveredElementId} onElementSelect={onElementSelect} onElementHover={onElementHover}>
                <CartProvider>
                    {sections.map((s, idx) => (
                        <EditableSection
                            key={s.id} id={s.id} name={s.name}
                            isSelected={selectedId === s.id}
                            onSelect={() => onSelect(s.id)}
                            onMoveUp={s.type !== "navigation" ? () => onMoveUp(s.id) : undefined}
                            onMoveDown={s.type !== "footer" ? () => onMoveDown(s.id) : undefined}
                            onDelete={s.type !== "navigation" ? () => onDelete(s.id) : undefined}
                            onAIAssist={() => onAIAssist(s.id)}
                            onImagePick={() => onImagePick(s.id)}
                            canMoveUp={idx > 1} canMoveDown={idx < sections.length - 1}
                            canDelete={s.type !== "navigation"}
                            dragState={dragState}
                            onDragStart={(e) => handleDragStart(s.id, e)}
                            onDragOver={(e) => handleDragOver(s.id, e)}
                            onDragEnd={handleDragEnd}
                            onDragLeave={handleDragLeave}
                        >
                            <SectionRenderer
                                section={s} sections={sections}
                                onUpdate={(key, value) => onUpdateSettings(s.id, key, value)}
                                onImagePick={s.type === "hero" ? () => onImagePick(s.id) : undefined}
                            />
                        </EditableSection>
                    ))}
                </CartProvider>
            </BuilderModeProvider>
        </div>
    );
}
R *cascade08RZ*cascade08Z\ *cascade08\]*cascade08]^ *cascade08^_*cascade08_` *cascade08`a*cascade08ab *cascade08bd*cascade08de *cascade08ei*cascade08ij *cascade08jk*cascade08kq *cascade08qu*cascade08u{ *cascade08{}*cascade08}~ *cascade08~Å*cascade08Å´ *cascade08´¨*cascade08¨≠ *cascade08≠Æ*cascade08Æ≤ *cascade08≤≥*cascade08≥µ *cascade08µ∂*cascade08∂≈ *cascade08≈∆*cascade08∆Ã *cascade08ÃÕ*cascade08Õ£ *cascade08£∂*cascade08∂¡ *cascade08¡ÂÂã	 *cascade08ã	æ	*cascade08æ	ó *cascade08óö *cascade08öú *cascade08ú† *cascade08†© *cascade08©´ *cascade08´≤ *cascade08≤¥ *cascade08¥˝ *cascade08˝Å*cascade08Åƒ *cascade08ƒ»*cascade08»÷ *cascade08÷Ó*cascade08Óä *cascade08äé*cascade08éè *cascade08èû*cascade08û” *cascade08”◊*cascade08◊Ä *cascade08ÄÇ*cascade08Çœ *cascade08œ∑ *cascade08∑Ã *cascade08Ãÿ*cascade08ÿ¡ *cascade08¡Õ*cascade08ÕÔ *cascade08Ô—*cascade08—∆ *cascade08∆ﬁ*cascade08ﬁß% *cascade08ß%Æ%*cascade08Æ%µ% *cascade08µ%÷%*cascade08÷%„% *cascade08„%ˆ% *cascade08ˆ%ñ&*cascade08ñ&ó& *cascade08ó&‘& *cascade08‘&Ù&*cascade08Ù&ı& *cascade08ı&∫' *cascade08∫'÷'*cascade08÷'◊' *cascade08◊'¯( *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72®file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/BuilderCanvas.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version