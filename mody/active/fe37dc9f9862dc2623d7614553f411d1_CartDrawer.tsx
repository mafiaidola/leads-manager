‹"use client";

/**
 * Cart Drawer - Slide-out cart panel
 * Phase 12: Updated with real images
 */

import Image from "next/image";
import { useCart } from "./CartProvider";
import Link from "next/link";

export function CartDrawer() {
    const { items, isCartOpen, setCartOpen, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#1a1a1a] shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-white font-bold text-lg">Cart ({totalItems})</h2>
                    <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-white text-2xl">‚úï</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Your cart is empty</p>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex gap-4 bg-[#252525] rounded-lg p-3">
                                <div className="w-20 h-20 bg-white rounded-lg relative overflow-hidden">
                                    {item.image ? <Image src={item.image} alt={item.name} fill className="object-contain p-1" /> : <span className="flex items-center justify-center h-full text-3xl">üëü</span>}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-medium">{item.name}</h3>
                                    <p className="font-bold" style={{ color: "var(--theme-primary, #E53935)" }}>${item.price}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 bg-gray-700 rounded text-white hover:bg-gray-600">-</button>
                                        <span className="text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 bg-gray-700 rounded text-white hover:bg-gray-600">+</button>
                                        <button onClick={() => removeItem(item.id)} className="ml-auto text-gray-400 hover:text-red-500 text-sm">Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {items.length > 0 && (
                    <div className="p-4 border-t border-gray-800 space-y-3">
                        <div className="flex justify-between text-white">
                            <span>Subtotal</span>
                            <span className="font-bold">${totalPrice.toFixed(2)}</span>
                        </div>
                        <Link href="/newlayout1/preview/checkout" onClick={() => setCartOpen(false)} className="block w-full py-3 text-white text-center font-bold rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: "var(--theme-primary, #E53935)", borderRadius: "var(--theme-border-radius, 8px)" }}>CHECKOUT</Link>
                        <Link href="/newlayout1/preview/cart" onClick={() => setCartOpen(false)} className="block w-full py-3 border border-gray-600 text-white text-center font-medium rounded-lg hover:bg-gray-800 transition-colors">View Cart</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
‹*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72ùfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/CartDrawer.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version