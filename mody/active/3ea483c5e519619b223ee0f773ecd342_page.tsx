“B"use client";

/**
 * Checkout Page - Posts order to /api/orders
 * Phase 2: Real API integration
 * UPDATED: Uses useBuilderSettings for consistent branding
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateNavigation } from "../TemplateNavigation";
import { useCart } from "../CartProvider";
import { toast } from "sonner";
import { useBuilderSettings } from "../builder/useBuilderSettings";

export default function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCart();
    const router = useRouter();
    const { navProps } = useBuilderSettings();
    const [isProcessing, setIsProcessing] = useState(false);
    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", phone: "",
        address: "", city: "", zip: "", country: "EG",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;

        setIsProcessing(true);
        try {
            const orderPayload = {
                items: items.map(item => ({
                    productId: item.id.split("-")[0], // Extract real product ID
                    quantity: item.quantity,
                    price: item.price,
                })),
                shippingAddress: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    address1: form.address,
                    city: form.city,
                    postalCode: form.zip,
                    country: form.country,
                    phone: form.phone,
                },
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload),
            });
            const json = await res.json();

            if (json.success) {
                clearCart();
                toast.success("üéâ Order placed successfully!");
                router.push(`/newlayout1/preview/order-confirmed?orderId=${json.data.id}&orderNumber=${json.data.order_number}`);
            } else {
                toast.error(json.message || "Failed to place order");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        }
        setIsProcessing(false);
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a]">
            <TemplateNavigation {...navProps} />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>
                <div className="grid md:grid-cols-2 gap-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h2 className="text-white font-bold mb-4">Shipping Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" required className="p-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                            <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" required className="p-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                        </div>
                        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required className="w-full p-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                        <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full p-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                        <input name="address" value={form.address} onChange={handleChange} placeholder="Address" required className="w-full p-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                        <div className="grid grid-cols-2 gap-4">
                            <input name="city" value={form.city} onChange={handleChange} placeholder="City" required className="p-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                            <input name="zip" value={form.zip} onChange={handleChange} placeholder="ZIP Code" required className="p-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                        </div>
                        <button type="submit" disabled={isProcessing || items.length === 0} className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 mt-6" style={{ backgroundColor: "var(--theme-primary, #E53935)", borderRadius: "var(--theme-border-radius, 8px)" }}>
                            {isProcessing ? "Processing..." : `PAY $${totalPrice.toFixed(2)}`}
                        </button>
                    </form>
                    <div className="bg-[#252525] rounded-xl p-6">
                        <h2 className="text-white font-bold mb-4">Order Summary</h2>
                        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-3">
                                    {/* Product Thumbnail */}
                                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#1a1a1a]">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">üì¶</div>
                                        )}
                                    </div>
                                    {/* Item Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{item.name}</p>
                                        {/* Color & Size */}
                                        {(item.color || item.size) && (
                                            <p className="text-gray-500 text-xs mt-0.5">
                                                {item.color && <span className="inline-flex items-center"><span className="w-3 h-3 rounded-full mr-1 inline-block" style={{ backgroundColor: item.color }} />{item.color}</span>}
                                                {item.color && item.size && <span className="mx-1">‚Ä¢</span>}
                                                {item.size && <span>Size: {item.size}</span>}
                                            </p>
                                        )}
                                        <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                                    </div>
                                    {/* Price */}
                                    <div className="text-right shrink-0">
                                        <p className="text-white font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                        {item.quantity > 1 && <p className="text-gray-500 text-xs">${item.price} each</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-700 pt-4 space-y-2">
                            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${totalPrice.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-400"><span>Shipping</span><span>FREE</span></div>
                            <div className="flex justify-between text-white font-bold text-lg"><span>Total</span><span>${totalPrice.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
& *cascade08&'*cascade08'( *cascade08()*cascade08)* *cascade08*+*cascade08+. *cascade08.1*cascade0813 *cascade0834*cascade0845 *cascade085:*cascade08:M *cascade08MP*cascade08PR *cascade08RW*cascade08WX *cascade08X]*cascade08]d *cascade08d††˘ *cascade08˘Ω*cascade08Ωª *cascade08ªÍÍ´ *cascade08´‰*cascade08‰¬ *cascade08¬Î*cascade08Îä	 *cascade08ä	®	*cascade08®	©	 *cascade08©	—	*cascade08—	“	 *cascade08“	‘	*cascade08‘	÷	 *cascade08÷	Í	*cascade08Í	Î	 *cascade08Î	«
*cascade08«
»
 *cascade08»
–
*cascade08–
—
 *cascade08—
’*cascade08’÷ *cascade08÷‡*cascade08‡· *cascade08·˛*cascade08˛ˇ *cascade08ˇå*cascade08åç *cascade08çè*cascade08èê *cascade08êó*cascade08óò *cascade08òõ*cascade08õú *cascade08ú´*cascade08´¨ *cascade08¨≥*cascade08≥¥ *cascade08¥∆*cascade08∆« *cascade08«Í*cascade08ÍÎ *cascade08ÎÛ*cascade08ÛÙ *cascade08Ù˝*cascade08˝˛ *cascade08˛ˇ*cascade08ˇÄ *cascade08ÄÅ*cascade08ÅÇ *cascade08Çç*cascade08çé *cascade08éØ*cascade08Ø∞ *cascade08∞∫*cascade08∫ª *cascade08ª¬*cascade08¬√ *cascade08√«*cascade08«» *cascade08»–*cascade08–— *cascade08—“*cascade08“” *cascade08”ﬂ*cascade08ﬂ‡ *cascade08‡ä*cascade08äå *cascade08åç*cascade08çñ *cascade08ñæ*cascade08æÀ *cascade08À”*cascade08”ç *cascade08çî*cascade08îú *cascade08úù*cascade08ù© *cascade08©™*cascade08™Ω *cascade08ΩÕ*cascade08Õ–*cascade08–— *cascade08—Ù*cascade08Ùﬂ *cascade08ﬂÌ*cascade08ÌÅ *cascade08ÅÇ*cascade08Çê *cascade08êë*cascade08ëï *cascade08ïñ*cascade08ñõ *cascade08õú*cascade08úù *cascade08ùü*cascade08ü° *cascade08°¢*cascade08¢£ *cascade08£§*cascade08§ß *cascade08ß´*cascade08´  *cascade08 Õ*cascade08Õ– *cascade08–ÿ*cascade08ÿŸ *cascade08ŸÂ*cascade08ÂÊ *cascade08ÊÌ*cascade08ÌÓ *cascade08ÓÄ*cascade08ÄÅ *cascade08Åâ*cascade08âó *cascade08óü*cascade08ü† *cascade08†°*cascade08°¶ *cascade08¶™*cascade08™± *cascade08±¥*cascade08¥∑ *cascade08∑∫*cascade08∫ª *cascade08ªæ*cascade08æ¡ *cascade08¡¬*cascade08¬ƒ *cascade08ƒ≈*cascade08≈« *cascade08«…*cascade08…À *cascade08ÀÕ*cascade08Õ– *cascade08–—*cascade08—’ *cascade08’÷*cascade08÷ÿ *cascade08ÿ€*cascade08€ﬂ *cascade08ﬂ·*cascade08·„ *cascade08„Â*cascade08ÂÁ *cascade08ÁÈ*cascade08ÈÎ *cascade08ÎÏ*cascade08ÏÌ *cascade08ÌÓ*cascade08Ó¸ *cascade08¸Ñ*cascade08Ñã *cascade08ãå*cascade08å∞ *cascade08∞Ω*cascade08Ωƒ *cascade08ƒ»*cascade08»  *cascade08 ı*cascade08ıÇ *cascade08ÇÖ*cascade08ÖÜ *cascade08Üá*cascade08áù *cascade08ù§*cascade08§ö *cascade08öß*cascade08ßØ *cascade08Ø∞*cascade08∞≤ *cascade08≤›*cascade08›Î *cascade08ÎÏ*cascade08ÏÌ *cascade08ÌÓ*cascade08Ó¸ *cascade08¸É*cascade08ÉÙ *cascade08Ù¯*cascade08¯˘ *cascade08˘˙*cascade08˙ˇ *cascade08ˇÉ *cascade08É Ñ  *cascade08Ñ å *cascade08å ç  *cascade08ç è *cascade08è ë  *cascade08ë í *cascade08í ì  *cascade08ì î *cascade08î ï  *cascade08ï ò *cascade08ò ô  *cascade08ô û *cascade08û ü  *cascade08ü † *cascade08† °  *cascade08° ¢ *cascade08¢ £  *cascade08£ § *cascade08§ ¶  *cascade08¶ ¨ *cascade08¨ ≠  *cascade08≠ ¥ *cascade08¥ ¬  *cascade08¬ ≈ *cascade08≈ «  *cascade08« … *cascade08… °" *cascade08°"§"*cascade08§"ß" *cascade08ß"©"*cascade08©"™" *cascade08™"±"*cascade08±"≤" *cascade08≤"ª"*cascade08ª"º" *cascade08º"÷"*cascade08÷"‰" *cascade08‰"Ë"*cascade08Ë"¯# *cascade08¯#Ä$*cascade08Ä$Å$ *cascade08Å$á$*cascade08á$â$ *cascade08â$©$*cascade08©$™$ *cascade08™$´$*cascade08´$π$ *cascade08π$Ω$*cascade08Ω$æ$ *cascade08æ$¡$*cascade08¡$Ê& *cascade08Ê&Ì&*cascade08Ì&Ó& *cascade08Ó&Ô&*cascade08Ô&ú' *cascade08ú'ä(*cascade08ä(®) *cascade08®)®)*cascade08®)* *cascade08*Ò**cascade08Ò*ˆ* *cascade08ˆ*è+*cascade08è+Ü, *cascade08Ü,˚/*cascade08˚/É0 *cascade08É0£1*cascade08£1•1 *cascade08•1Ì1Ì1Ó1 *cascade08Ó1¶2¶2ß2 *cascade08ß2≤2*cascade08≤2≥2 *cascade08≥2∂2*cascade08∂2∑2 *cascade08∑2ø2*cascade08ø2¡2 *cascade08¡2ö4*cascade08ö4£4 *cascade08£4•4*cascade08•4¶4 *cascade08¶4≤4*cascade08≤4≥4 *cascade08≥4µ4*cascade08µ4‹4 *cascade08‹4˜4*cascade08˜4¸4 *cascade08¸4°5*cascade08°5¢5 *cascade08¢5·5*cascade08·5‚5 *cascade08‚5ı5*cascade08ı5˙5 *cascade08˙5ñ6*cascade08ñ6ó6 *cascade08ó6Ú6Ú6ı6 *cascade08ı6á7*cascade08á7à7 *cascade08à7°7*cascade08°7¢7 *cascade08¢7î9*cascade08î9ß9 *cascade08ß9±:*cascade08±:≤: *cascade08≤:…:*cascade08…: : *cascade08 :Œ:*cascade08Œ:Ù: *cascade08Ù:¯:*cascade08¯:˙: *cascade08˙:˝:*cascade08˝:˛: *cascade08˛:ì;*cascade08ì;î; *cascade08î;ù;*cascade08ù; ; *cascade08 ;ë<ë<í< *cascade08í<∑<*cascade08∑<∏< *cascade08∏<ø<*cascade08ø<¿< *cascade08¿<Ò<*cascade08Ò<“B *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72†file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/checkout/page.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version