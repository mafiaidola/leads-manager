§1"use client";

/**
 * Section Library Panel - Sidebar panel with categories and search
 * Replaces modal popup for better UX
 * ~110 lines - AI friendly
 */

import { useState, useMemo } from "react";
import { SectionCard } from "./SectionCard";

interface SectionType {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: "layout" | "content" | "commerce" | "social";
    thumbnail?: string;
}

const SECTIONS: SectionType[] = [
    // Layout
    { id: "hero", name: "Hero Banner", icon: "üéØ", description: "Large banner with CTA", category: "layout", thumbnail: "/builder-thumbs/section_hero_1769995034508.png" },
    { id: "pageHeader", name: "Page Header", icon: "üìë", description: "Title and breadcrumb", category: "layout", thumbnail: "/builder-thumbs/section_pageheader_1770009013032.png" },
    { id: "footer", name: "Footer", icon: "üìÉ", description: "Links and social", category: "layout", thumbnail: "/builder-thumbs/section_footer_1769995077702.png" },
    // Content  
    { id: "features", name: "Features", icon: "‚ú®", description: "Highlight features", category: "content", thumbnail: "/builder-thumbs/section_features_1769995049816.png" },
    { id: "testimonials", name: "Testimonials", icon: "‚≠ê", description: "Customer reviews", category: "content", thumbnail: "/builder-thumbs/section_testimonials_1769995105268.png" },
    { id: "faq", name: "FAQ", icon: "‚ùì", description: "Questions & answers", category: "content", thumbnail: "/builder-thumbs/section_faq_1769995117427.png" },
    { id: "gallery", name: "Image Gallery", icon: "üñºÔ∏è", description: "Photo gallery", category: "content", thumbnail: "/builder-thumbs/section_gallery_1770009027517.png" },
    { id: "newsletter", name: "Newsletter", icon: "üì¨", description: "Email signup", category: "content", thumbnail: "/builder-thumbs/section_newsletter_1770009040786.png" },
    { id: "about", name: "About", icon: "üìñ", description: "Company story", category: "content", thumbnail: "/builder-thumbs/section_about_1770009055081.png" },
    { id: "team", name: "Team", icon: "üë•", description: "Team members", category: "social", thumbnail: "/builder-thumbs/section_team_1770009068204.png" },
    // Commerce
    { id: "products", name: "Product Grid", icon: "üõçÔ∏è", description: "Featured products", category: "commerce", thumbnail: "/builder-thumbs/section_products_1769995063845.png" },
    { id: "cta", name: "Call to Action", icon: "üì¢", description: "Promo banner", category: "commerce", thumbnail: "/builder-thumbs/section_cta_1770009082698.png" },
    // Social
    { id: "contact", name: "Contact Form", icon: "üìß", description: "Contact info", category: "social", thumbnail: "/builder-thumbs/section_contact_1769995128377.png" },
];

const CATEGORIES = [
    { id: "layout", label: "üìê Layout", icon: "üìê" },
    { id: "content", label: "üìù Content", icon: "üìù" },
    { id: "commerce", label: "üõí Commerce", icon: "üõí" },
    { id: "social", label: "üåê Social", icon: "üåê" },
] as const;

interface SectionLibraryPanelProps {
    onAdd: (sectionType: string) => void;
    onDragStart?: (e: React.DragEvent, sectionType: string) => void;
}

export function SectionLibraryPanel({ onAdd, onDragStart }: SectionLibraryPanelProps) {
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<Set<string>>(new Set(["layout", "content"]));

    const filteredSections = useMemo(() => {
        if (!search.trim()) return SECTIONS;
        const q = search.toLowerCase();
        return SECTIONS.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }, [search]);

    const toggle = (id: string) => {
        const next = new Set(expanded);
        next.has(id) ? next.delete(id) : next.add(id);
        setExpanded(next);
    };

    const handleDragStart = (e: React.DragEvent, sectionType: string) => {
        onDragStart?.(e, sectionType);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="üîç Search sections..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
            </div>
            {/* Categories */}
            <div className="flex-1 overflow-y-auto">
                {CATEGORIES.map(cat => {
                    const items = filteredSections.filter(s => s.category === cat.id);
                    if (items.length === 0) return null;
                    const isOpen = expanded.has(cat.id);
                    return (
                        <div key={cat.id} className="border-b border-gray-100">
                            <button onClick={() => toggle(cat.id)} className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{cat.label}</span>
                                <span className="text-gray-400 text-xs">{isOpen ? "‚ñº" : "‚ñ∂"} ({items.length})</span>
                            </button>
                            {isOpen && (
                                <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                    {items.map(s => (
                                        <SectionCard key={s.id} id={s.id} name={s.name} description={s.description} icon={s.icon} thumbnail={s.thumbnail} onAdd={() => onAdd(s.id)} onDragStart={handleDragStart} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredSections.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <p className="text-2xl mb-2">üîç</p>
                        <p className="text-sm">No sections found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
– *cascade08–ç*cascade08çÉ *cascade08É∆*cascade08∆Ø *cascade08ØÓ*cascade08ÓÓ *cascade08ÓØ	*cascade08Ø	§
 *cascade08§
È
*cascade08È
Œ *cascade08Œä*cascade08ä˝ *cascade08˝Ω*cascade08Ω´ *cascade08´Ó*cascade08Ó” *cascade08”ë*cascade08ëÒ *cascade08ÒÆ*cascade08Æ∂ *cascade08∂˜*cascade08˜‚ *cascade08‚û*cascade08ûò *cascade08òÿ*cascade08ÿ§1 *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72Æfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/SectionLibraryPanel.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version