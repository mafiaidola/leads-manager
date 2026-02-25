∂"use client";

/**
 * Section Card - Draggable thumbnail preview for section library
 * Fixed: Buttons below thumbnail, no overlap
 * ~65 lines - AI friendly
 */

import { useState } from "react";

interface SectionCardProps {
    id: string;
    name: string;
    description: string;
    icon: string;
    thumbnail?: string;
    onAdd: () => void;
    onDragStart: (e: React.DragEvent, sectionType: string) => void;
}

export function SectionCard({ id, name, description, icon, thumbnail, onAdd, onDragStart }: SectionCardProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        e.dataTransfer.setData("sectionType", id);
        e.dataTransfer.effectAllowed = "copy";
        onDragStart(e, id);
    };

    const handleDragEnd = () => setIsDragging(false);

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`group relative border border-gray-200 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:border-red-300 ${isDragging ? "opacity-50 scale-95" : ""}`}
        >
            {/* Thumbnail Preview - Clean, no overlays */}
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {thumbnail ? (
                    <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <span className="text-3xl opacity-60">{icon}</span>
                    </div>
                )}
            </div>

            {/* Info + Actions - BELOW thumbnail */}
            <div className="p-2.5 bg-white">
                <p className="font-medium text-gray-800 text-sm truncate">{name}</p>
                <p className="text-xs text-gray-500 truncate mb-2">{description}</p>

                {/* Action buttons - Always visible, clear hierarchy */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd(); }}
                        className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-lg font-medium text-xs hover:bg-red-600 transition-colors"
                    >
                        + Add
                    </button>
                    <span className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs cursor-grab">
                        ‚ãÆ‚ãÆ
                    </span>
                </div>
            </div>
        </div>
    );
}
X *cascade08X^*cascade08^_ *cascade08_`*cascade08`a *cascade08ab*cascade08bc *cascade08cf*cascade08fg *cascade08gh*cascade08hi *cascade08ik*cascade08kp *cascade08ps*cascade08st *cascade08tu*cascade08uv *cascade08vw*cascade08wy *cascade08yz*cascade08z{ *cascade08{}*cascade08}~ *cascade08~Ç*cascade08Çà *cascade08àâ*cascade08âÈ	 *cascade08È	˛	*cascade08˛	Î *cascade08Î˘*cascade08˘˝ *cascade08˝ˇ*cascade08ˇÉ *cascade08ÉÜ*cascade08Üà *cascade08àâ*cascade08âä *cascade08äå*cascade08åç *cascade08çë*cascade08ëí *cascade08íì*cascade08ìî *cascade08îö*cascade08öõ *cascade08õü*cascade08ü† *cascade08†£*cascade08£ƒ *cascade08ƒÍ*cascade08ÍÎ *cascade08ÎÏ*cascade08ÏÌ *cascade08ÌÙ*cascade08Ùı *cascade08ıˆ*cascade08ˆ˜ *cascade08˜˘*cascade08˘˙ *cascade08˙˚*cascade08˚¸ *cascade08¸Ä*cascade08ÄÅ *cascade08ÅÇ*cascade08ÇÖ *cascade08ÖÜ*cascade08Üá *cascade08áã*cascade08ãé *cascade08éë*cascade08ëí *cascade08íî*cascade08îï *cascade08ïñ*cascade08ñò *cascade08òß*cascade08ß® *cascade08®Ã*cascade08ÃÕ *cascade08Õ—*cascade08—“ *cascade08“÷*cascade08÷⁄ *cascade08⁄€*cascade08€‡ *cascade08‡·*cascade08·‚ *cascade08‚*cascade08Ò *cascade08ÒÛ*cascade08ÛÙ *cascade08Ùı*cascade08ı˘ *cascade08˘ü*cascade08ü† *cascade08†®*cascade08®© *cascade08©µ*cascade08µ∂ *cascade08∂º*cascade08ºΩ *cascade08Ω√*cascade08√≈ *cascade08≈È*cascade08È˚ *cascade08˚˛*cascade08˛ˇ *cascade08ˇÇ*cascade08Ç† *cascade08†∏*cascade08∏Î *cascade08ÎÉ*cascade08Éè *cascade08èñ*cascade08ñô *cascade08ôö*cascade08öû *cascade08û°*cascade08°‘ *cascade08‘’*cascade08’è *cascade08èë*cascade08ë© *cascade08©Æ*cascade08Æ≈ *cascade08≈À*cascade08À‚ *cascade08‚Ê*cascade08ÊÛ *cascade08ÛÙ*cascade08Ùˆ *cascade08ˆ˚*cascade08˚˛ *cascade08˛É*cascade08ÉÑ *cascade08ÑÖ*cascade08ÖÜ *cascade08Üâ*cascade08âî *cascade08îï*cascade08ïô *cascade08ôö*cascade08öú *cascade08úù*cascade08ùû *cascade08û†*cascade08†° *cascade08°£*cascade08£´ *cascade08´±*cascade08±µ *cascade08µ∂*cascade08∂— *cascade08—ÿ*cascade08ÿÏ *cascade08ÏÓ*cascade08ÓÒ *cascade08ÒÚ*cascade08Úá *cascade08áâ*cascade08â∂ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¶file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/SectionCard.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version