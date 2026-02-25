È1"use client";

/**
 * Left Sidebar - Pages, Sections, and Theme tabs
 * Enhanced: Sections tab with drag-drop library
 * ~100 lines - AI friendly
 */

import { useState } from "react";
import { PageData, SectionData } from "./types";
import { ThemeSettings } from "./theme";
import { PageRow } from "./PageRow";
import { ThemePicker } from "./ThemePicker";
import { SectionLibraryPanel } from "./SectionLibraryPanel";

type SidebarTab = "pages" | "sections" | "theme";

interface LeftSidebarProps {
    theme: ThemeSettings;
    pages: PageData[];
    currentPageId: string;
    sections: SectionData[];
    selectedId: string | null;
    activeTab: SidebarTab;
    onTabChange: (tab: SidebarTab) => void;
    onBack: () => void;
    onPageSelect: (pageId: string, pageName: string) => void;
    onPageAdd: () => void;
    onPageDelete: (pageId: string) => void;
    onPageDuplicate?: (pageId: string) => void;
    onPageRename?: (pageId: string, newName: string) => void;
    onPageReorder?: (fromIndex: number, toIndex: number) => void;
    onPageToggleVisibility?: (pageId: string) => void;
    onPageSEO?: (pageId: string) => void;
    onPageAIGenerate?: (pageId: string) => void;
    footerLinkedPages?: string[];
    onSectionSelect: (id: string) => void;
    onAddSection: (sectionType: string) => void;
    onSectionDragStart?: (e: React.DragEvent, sectionType: string) => void;
    onThemePreset: (primary: string, secondary: string) => void;
}

export function LeftSidebar({ theme, pages, currentPageId, sections, selectedId, activeTab, onTabChange, onBack, onPageSelect, onPageAdd, onPageDelete, onPageDuplicate, onPageRename, onPageReorder, onPageToggleVisibility, onPageSEO, onPageAIGenerate, footerLinkedPages = [], onSectionSelect, onAddSection, onSectionDragStart, onThemePreset }: LeftSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [dragIdx, setDragIdx] = useState<number | null>(null);

    const startEdit = (pageId: string, name: string) => { setEditingId(pageId); setEditValue(name); };
    const finishEdit = () => { if (editingId && editValue.trim() && onPageRename) onPageRename(editingId, editValue.trim()); setEditingId(null); };
    const handleDragStart = (idx: number) => setDragIdx(idx);
    const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx && onPageReorder) { onPageReorder(dragIdx, idx); setDragIdx(idx); } };

    return (
        <div className="hidden md:flex w-64 h-full bg-white border-r border-gray-200 flex-col shrink-0 overflow-hidden shadow-sm">
            <div className="p-3 border-b border-gray-200 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium text-sm">â† Back</button>
            </div>
            {/* 3 Tabs */}
            <div className="flex border-b border-gray-200 shrink-0">
                <button onClick={() => onTabChange("pages")} className={`flex-1 py-2 text-xs font-medium ${activeTab === "pages" ? "text-red-600 border-b-2 border-red-500" : "text-gray-500"}`}>ğŸ“„ Pages</button>
                <button onClick={() => onTabChange("sections")} className={`flex-1 py-2 text-xs font-medium ${activeTab === "sections" ? "text-red-600 border-b-2 border-red-500" : "text-gray-500"}`}>ğŸ§© Sections</button>
                <button onClick={() => onTabChange("theme")} className={`flex-1 py-2 text-xs font-medium ${activeTab === "theme" ? "text-red-600 border-b-2 border-red-500" : "text-gray-500"}`}>ğŸ¨ Theme</button>
            </div>
            <div className="flex-1 overflow-hidden">
                {activeTab === "pages" && (
                    <div className="h-full overflow-y-auto scrollbar-hide">
                        <div className="p-3 flex items-center justify-between hover:bg-gray-50">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pages</span>
                            <button onClick={onPageAdd} className="text-xs text-red-500 font-medium hover:text-red-600">+ Add</button>
                        </div>
                        <div className="px-3 pb-3">
                            {pages.map((p, idx) => (
                                <PageRow key={p.id} page={p} idx={idx} isCurrent={currentPageId === p.id} isDragging={dragIdx === idx} isEditing={editingId === p.id} editValue={editValue} linkedFromFooter={footerLinkedPages.includes(p.id)} onEditChange={setEditValue} onEditFinish={finishEdit} onEditCancel={() => setEditingId(null)} onStartEdit={() => startEdit(p.id, p.name)} onSelect={() => onPageSelect(p.id, p.name)} onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={() => setDragIdx(null)} onSEO={onPageSEO ? () => onPageSEO(p.id) : undefined} onToggleVisibility={onPageToggleVisibility ? () => onPageToggleVisibility(p.id) : undefined} onDuplicate={onPageDuplicate ? () => onPageDuplicate(p.id) : undefined} onDelete={() => onPageDelete(p.id)} onAIGenerate={onPageAIGenerate ? () => onPageAIGenerate(p.id) : undefined} />
                            ))}
                        </div>
                        {/* Current Page Sections */}
                        <div className="border-t border-gray-100 pt-2">
                            <div className="px-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Sections</div>
                            <div className="px-3 pb-3">
                                {sections.map(s => <div key={s.id} onClick={() => onSectionSelect(s.id)} className={`px-2.5 py-2 rounded-lg cursor-pointer mb-1 text-sm transition-all ${selectedId === s.id ? "bg-red-50 text-red-600 font-medium shadow-sm" : "hover:bg-gray-50 text-gray-700"}`}>{s.name}</div>)}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === "sections" && (
                    <SectionLibraryPanel onAdd={onAddSection} onDragStart={onSectionDragStart} />
                )}
                {activeTab === "theme" && (
                    <ThemePicker theme={theme} onSelect={onThemePreset} />
                )}
            </div>
        </div>
    );
}


* *cascade08*5*cascade085H *cascade08HR *cascade08RS*cascade08ST *cascade08TX*cascade08XY *cascade08Y\*cascade08\] *cascade08]a*cascade08ab *cascade08bc*cascade08cd *cascade08df*cascade08fg *cascade08gi*cascade08ik *cascade08km*cascade08mp *cascade08pr*cascade08rt *cascade08tu*cascade08uy *cascade08yz *cascade08z}*cascade08}å *cascade08åÕ*cascade08ÕŠ *cascade08Š’*cascade08’“ *cascade08“”*cascade08”­ *cascade08­µ*cascade08µ¶ *cascade08¶·*cascade08·ï *cascade08ïÂ	*cascade08Â	
 *cascade08
”
*cascade08”
¥
 *cascade08¥
©
*cascade08©
ª
 *cascade08ª
¶
*cascade08¶
¹
 *cascade08¹
à
*cascade08à
š *cascade08šÄ*cascade08Äß *cascade08ßó*cascade08ó‹ *cascade08‹Œ*cascade08Œ× *cascade08×á*cascade08á‚ *cascade08‚ƒ*cascade08ƒ› *cascade08›¤*cascade08¤Ğ *cascade08Ğë*cascade08ë¤ *cascade08¤­*cascade08­ƒ *cascade08ƒ„ *cascade08„Š *cascade08Š‹*cascade08‹¹ *cascade08¹—*cascade08—¶ *cascade08¶· *cascade08·½ *cascade08½¾*cascade08¾× *cascade08×÷ *cascade08÷ú *cascade08úû*cascade08ûü *cascade08üı*cascade08ı *cascade08§ *cascade08§©*cascade08©¼ *cascade08¼À*cascade08ÀĞ *cascade08Ğ×*cascade08×Ø *cascade08ØÙ*cascade08ÙÛ *cascade08Ûß*cascade08ßà *cascade08àæ*cascade08æç *cascade08çê*cascade08êë *cascade08ëï*cascade08ïğ *cascade08ğó*cascade08ó‘ *cascade08‘’*cascade08’“ *cascade08“”*cascade08”  *cascade08 ¤ *cascade08¤Æ *cascade08ÆÌ*cascade08ÌÍ *cascade08ÍÎ*cascade08ÎÏ *cascade08ÏÖ *cascade08ÖØ *cascade08Øõ *cascade08õö *cascade08ö÷ *cascade08÷ù *cascade08ùú*cascade08ú‹ *cascade08‹Œ*cascade08Œ“ *cascade08“•*cascade08•– *cascade08–š*cascade08š¦ *cascade08¦§*cascade08§© *cascade08©Á*cascade08ÁÃ *cascade08ÃÄ*cascade08ÄÏ *cascade08ÏĞ *cascade08Ğì *cascade08ì§  *cascade08§ ³ *cascade08³ Æ *cascade08Æ Ö  *cascade08Ö ï  *cascade08ï ñ  *cascade08ñ ô *cascade08ô ! *cascade08!’! *cascade08’!¨!*cascade08¨!ª! *cascade08ª!²!*cascade08²!ß! *cascade08ß!ã!*cascade08ã!›# *cascade08›#Ï#*cascade08Ï#ù' *cascade08ù'Ä(*cascade08Ä(á( *cascade08á(å(*cascade08å(é( *cascade08é(í(*cascade08í(ˆ) *cascade08ˆ) ) *cascade08 )¡)*cascade08¡)¢)*cascade08¢)£)*cascade08£)¤) *cascade08¤)«)*cascade08«)¬) *cascade08¬)°)*cascade08°)±) *cascade08±)µ)*cascade08µ)¶) *cascade08¶)½)*cascade08½)Ù) *cascade08Ù)Ú)*cascade08Ú)æ) *cascade08æ)ê)*cascade08ê)ï) *cascade08ï)ğ)*cascade08ğ)ñ) *cascade08ñ)ó)*cascade08ó)õ) *cascade08õ)ö) *cascade08ö)û) *cascade08û)ı)*cascade08ı)ÿ) *cascade08ÿ)€**cascade08€*‚* *cascade08‚*ƒ**cascade08ƒ*…* *cascade08…*¢* *cascade08¢*£* *cascade08£*¥* *cascade08¥*¦**cascade08¦*²* *cascade08²*¼**cascade08¼*Á* *cascade08Á*Â**cascade08Â*É* *cascade08É*Ê**cascade08Ê*Ì* *cascade08Ì*Ñ**cascade08Ñ*Ü* *cascade08Ü*İ**cascade08İ*ß* *cascade08ß*÷**cascade08÷*ù* *cascade08ù*û**cascade08û*+ *cascade08++ *cascade08++ *cascade08++ *cascade08+¬+*cascade08¬+°+ *cascade08°+Æ+*cascade08Æ+È+ *cascade08È+Î+ *cascade08Î+Ï+*cascade08Ï+ç+ *cascade08ç+è+ *cascade08è+¾, *cascade08¾,Æ,*cascade08Æ,Ğ, *cascade08Ğ,Ó,*cascade08Ó,ğ, *cascade08ğ,ÿ,*cascade08ÿ,®- *cascade08®-Ä-*cascade08Ä-Ø- *cascade08Ø-æ-*cascade08æ-ú- *cascade08ú-™. *cascade08™.±.*cascade08±.µ. *cascade08µ.¸.*cascade08¸.Ó. *cascade08Ó.Ú.*cascade08Ú.â. *cascade08â.ê.*cascade08ê.ı. *cascade08ı./*cascade08/ƒ/ *cascade08ƒ/›/*cascade08›/œ/ *cascade08œ/ /*cascade08 /±/ *cascade08±/û/*cascade08û/Š0 *cascade08Š00*cascade0800 *cascade080—0*cascade08—0˜0 *cascade08˜0º0*cascade08º0½0 *cascade08½0Á0*cascade08Á0”1 *cascade08”1˜1*cascade08˜1¨1 *cascade08¨1©1*cascade08©1Å1 *cascade08Å1Æ1*cascade08Æ1Ç1 *cascade08Ç1È1*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¦file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/LeftSidebar.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version