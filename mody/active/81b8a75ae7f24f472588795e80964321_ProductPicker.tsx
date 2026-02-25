Î&/**
 * Product Picker Modal - Select products from store catalog
 * Allows selecting real products for featured sections
 * ~90 lines - AI friendly
 */

"use client";

import { useState, useEffect } from "react";

interface Product {
    id: string;
    name: string;
    price: number;
    image?: string;
    category?: string;
}

interface ProductPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (productIds: string[]) => void;
    selectedIds?: string[];
    maxSelect?: number;
    storeId?: string;
}

export function ProductPicker({ isOpen, onClose, onSelect, selectedIds = [], maxSelect = 8, storeId }: ProductPickerProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            // Mock data - replace with real API call
            setTimeout(() => {
                setProducts([
                    { id: "1", name: "Premium Sneakers", price: 199, image: "/placeholder-product.jpg", category: "Footwear" },
                    { id: "2", name: "Running Shoes", price: 149, image: "/placeholder-product.jpg", category: "Footwear" },
                    { id: "3", name: "Casual Loafers", price: 89, image: "/placeholder-product.jpg", category: "Footwear" },
                    { id: "4", name: "Athletic Trainers", price: 179, image: "/placeholder-product.jpg", category: "Sports" },
                    { id: "5", name: "Hiking Boots", price: 219, image: "/placeholder-product.jpg", category: "Outdoor" },
                    { id: "6", name: "Canvas Slip-ons", price: 59, image: "/placeholder-product.jpg", category: "Casual" },
                ]);
                setLoading(false);
            }, 500);
        }
    }, [isOpen, storeId]);

    if (!isOpen) return null;

    const toggle = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else if (next.size < maxSelect) next.add(id);
        setSelected(next);
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold">ðŸ“¦ Select Products ({selected.size}/{maxSelect})</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">âœ•</button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading products...</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {filtered.map(p => (
                                <button key={p.id} onClick={() => toggle(p.id)} className={`p-3 border rounded-xl text-left transition-all ${selected.has(p.id) ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500" : "border-gray-200 hover:border-gray-300"}`}>
                                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-2xl">ðŸ“¦</div>
                                    <p className="font-medium text-sm truncate">{p.name}</p>
                                    <p className="text-xs text-gray-500">${p.price}</p>
                                    {selected.has(p.id) && <span className="mt-1 inline-block px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">Selected</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={() => { onSelect(Array.from(selected)); onClose(); }} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700">Select Products</button>
                </div>
            </div>
        </div>
    );
}
Î&*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¨file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/ProductPicker.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version