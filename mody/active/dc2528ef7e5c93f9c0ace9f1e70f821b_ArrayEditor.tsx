�+"use client";

/**
 * ArrayEditor - Reusable CRUD array editor for section items
 * Used by: Features, FAQ, Testimonials, Team, Gallery
 * ~90 lines
 */

import { useState } from "react";

export interface ArrayItem {
    id: string;
    [key: string]: string | number | boolean | undefined;
}

interface FieldConfig {
    key: string;
    label: string;
    type: "text" | "textarea" | "emoji" | "image";
    placeholder?: string;
}

interface ArrayEditorProps {
    items: ArrayItem[];
    fields: FieldConfig[];
    onUpdate: (items: ArrayItem[]) => void;
    addLabel?: string;
    emptyMessage?: string;
    maxItems?: number;
}

export function ArrayEditor({ items, fields, onUpdate, addLabel = "+ Add Item", emptyMessage = "No items yet", maxItems = 20 }: ArrayEditorProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const addItem = () => {
        if (items.length >= maxItems) return;
        const newItem: ArrayItem = { id: `item-${Date.now()}` };
        fields.forEach(f => { newItem[f.key] = ""; });
        onUpdate([...items, newItem]);
        setExpandedId(newItem.id);
    };

    const updateItem = (id: string, key: string, value: string) => {
        onUpdate(items.map(item => item.id === id ? { ...item, [key]: value } : item));
    };

    const removeItem = (id: string) => {
        onUpdate(items.filter(item => item.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const moveItem = (id: string, direction: "up" | "down") => {
        const idx = items.findIndex(i => i.id === id);
        if ((direction === "up" && idx === 0) || (direction === "down" && idx === items.length - 1)) return;
        const newItems = [...items];
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
        onUpdate(newItems);
    };

    return (
        <div className="space-y-2">
            {items.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-4">{emptyMessage}</p>
            ) : (
                items.map((item, idx) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Header - always visible */}
                        <div className="flex items-center gap-2 p-2 bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                            <span className="text-gray-400 text-xs">{idx + 1}.</span>
                            <span className="flex-1 text-sm font-medium truncate">{String(item[fields[0]?.key] || "Untitled")}</span>
                            <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, "up"); }} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                            <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, "down"); }} disabled={idx === items.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                            <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="p-1 text-red-400 hover:text-red-600">✕</button>
                            <span className="text-gray-400 text-xs">{expandedId === item.id ? "▼" : "▶"}</span>
                        </div>
                        {/* Expanded fields */}
                        {expandedId === item.id && (
                            <div className="p-3 space-y-3 border-t border-gray-100">
                                {fields.map(field => (
                                    <div key={field.key}>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                                        {field.type === "textarea" ? (
                                            <textarea value={String(item[field.key] || "")} onChange={(e) => updateItem(item.id, field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none" rows={3} />
                                        ) : field.type === "emoji" ? (
                                            <input type="text" value={String(item[field.key] || "")} onChange={(e) => updateItem(item.id, field.key, e.target.value)} placeholder={field.placeholder || "🔍"} className="w-20 px-2 py-1.5 border border-gray-200 rounded text-2xl text-center focus:ring-1 focus:ring-red-500" maxLength={2} />
                                        ) : (
                                            <input type="text" value={String(item[field.key] || "")} onChange={(e) => updateItem(item.id, field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-red-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
            {items.length < maxItems && (
                <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors">
                    {addLabel}
                </button>
            )}
        </div>
    );
}
�+*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/settings/ArrayEditor.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version