¥$"use client";

/**
 * Template Navigation - Dynamic pages with EditableElement
 * Refactored: NavButton extracted
 * ~100 lines - Under limit ‚úÖ
 */

import { useState } from "react";
import { useCart } from "./CartProvider";
import { useBuilderMode } from "./BuilderModeContext";
import { EditableElement } from "./EditableElement";
import { NavButton, defaultNavItems } from "./NavButton";

interface TemplateNavigationProps {
    storeName?: string;
    logoUrl?: string;
    logoHeight?: number;
    onStoreNameChange?: (value: string) => void;
}

const MAX_VISIBLE_NAV = 5;

export function TemplateNavigation({ storeName = "LUXE KICKS", logoUrl, logoHeight = 32, onStoreNameChange }: TemplateNavigationProps) {
    const { totalItems, totalPrice, setCartOpen } = useCart();
    const { isBuilderMode, pages, activeNavId, onNavClick, isMobilePreview } = useBuilderMode();
    const [moreOpen, setMoreOpen] = useState(false);

    // Build nav items from pages
    const navItems = pages && pages.length > 0
        ? pages.map(p => ({ navId: p.name.toUpperCase(), pageId: p.id, href: `/newlayout1/preview/${p.id === "home" ? "" : p.id}` }))
        : defaultNavItems;

    const visibleNav = navItems.slice(0, MAX_VISIBLE_NAV);
    const overflowNav = navItems.slice(MAX_VISIBLE_NAV);

    return (
        <header className="sticky top-0 z-50 bg-[#111111] border-b border-gray-800">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo + Store Name */}
                    <div className="flex items-center gap-3">
                        {logoUrl ? (
                            <img src={logoUrl} alt={storeName} style={{ height: logoHeight }} className="w-auto object-contain" />
                        ) : (
                            <span className="text-red-500 text-2xl font-bold">‚ö°</span>
                        )}
                        <EditableElement elementId="nav-storename" elementType="heading" value={storeName} onValueChange={onStoreNameChange}>
                            <span className="text-white font-bold tracking-wider text-lg">{storeName}</span>
                        </EditableElement>
                    </div>

                    {/* Nav Items */}
                    {!isMobilePreview && (
                        <div className="hidden md:flex items-center gap-1">
                            {visibleNav.map(item => (
                                <NavButton key={item.navId} item={item} isActive={activeNavId === item.navId} isBuilderMode={isBuilderMode} onNavClick={onNavClick} />
                            ))}
                            {overflowNav.length > 0 && (
                                <div className="relative">
                                    <button onClick={() => setMoreOpen(!moreOpen)} className="px-3 py-1 text-sm text-gray-300 hover:text-white flex items-center gap-1">
                                        MORE ‚ñº
                                    </button>
                                    {moreOpen && (
                                        <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] rounded-lg border border-gray-700 py-2 min-w-[150px] shadow-xl">
                                            {overflowNav.map(item => (
                                                <NavButton key={item.navId} item={item} isActive={activeNavId === item.navId} isBuilderMode={isBuilderMode} onNavClick={(navId, pageId) => { onNavClick?.(navId, pageId); setMoreOpen(false); }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart + Actions */}
                    <div className="flex items-center gap-4">
                        <button className="text-gray-300 hover:text-white">üîç</button>
                        <button onClick={() => setCartOpen(true)} className="relative text-gray-300 hover:text-white">
                            üõí
                            {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{totalItems}</span>}
                        </button>
                        {totalPrice > 0 && <span className="text-white text-sm font-medium hidden sm:block">${totalPrice.toFixed(2)}</span>}
                    </div>
                </div>
            </nav>
        </header>
    );
}
, *cascade08,002 *cascade082334 *cascade084556 *cascade08699: *cascade08:<<? *cascade08?F*cascade08FG *cascade08GH*cascade08HI IL*cascade08LM MN*cascade08NR *cascade08RX*cascade08XY Y]*cascade08]^ ^_*cascade08_` *cascade08`a ad*cascade08de *cascade08eg*cascade08gi ij*cascade08jk kl *cascade08lo*cascade08ow wx*cascade08xy y{ *cascade08{} *cascade08}~~Ä *cascade08
ÄÇ ÇÉ*cascade08
ÉÖ Öà*cascade08
àâ âë*cascade08ëπ *cascade08π„ *cascade08„ööâ*cascade08â∆ *cascade08∆‹‹Ù *cascade08Ùı*cascade08ı˘ *cascade08˘˚ *cascade08
˚˛ ˛Ä *cascade08ÄÅ *cascade08
ÅÑ ÑÖ*cascade08ÖÜ *cascade08Üá *cascade08
áä äã*cascade08ãç *cascade08çé*cascade08
éê êí*cascade08
íñ ñô *cascade08
ôõ õú*cascade08
úù ùü*cascade08
ü† †°*cascade08°£ *cascade08£¶*cascade08¶ß *cascade08ß®*cascade08®© *cascade08©´*cascade08´¨¨Æ*cascade08ÆØ *cascade08Ø∞*cascade08∞± *cascade08±¥*cascade08
¥µ µ∂*cascade08
∂∑ ∑ª*cascade08ªΩ *cascade08Ωæ*cascade08æø *cascade08ø¿*cascade08¿¡ *cascade08¡¬*cascade08¬Ç *cascade08Çããú*cascade08úØ*cascade08Øÿ *cascade08ÿŸ*cascade08Ÿﬁ *cascade08ﬁ‡*cascade08‡‚ *cascade08‚„*cascade08„‰ *cascade08‰Á *cascade08ÁË*cascade08ËÎ *cascade08ÎÓ*cascade08ÓÔ *cascade08
ÔÚ ÚÛ*cascade08
ÛÙ Ùı*cascade08ı˘ *cascade08˘˝*cascade08˝ç *cascade08
ç® ®´*cascade08´¨ *cascade08¨≠*cascade08≠Ø *cascade08
Ø» »’*cascade08
’÷ ÷◊*cascade08
◊Ó Ó¯ *cascade08¯˘*cascade08˘˙ *cascade08˙¸*cascade08¸˝ *cascade08˝ˇ*cascade08ˇÉ *cascade08ÉÑ*cascade08ÑÜ *cascade08Üá*cascade08áä *cascade08äã*cascade08ãç *cascade08çè*cascade08èê *cascade08êë*cascade08ëï *cascade08ïñ*cascade08ñó *cascade08óò*cascade08òö *cascade08öú*cascade08úû *cascade08ûü*cascade08ü† *cascade08†°*cascade08°§ *cascade08
§´ ´¨*cascade08
¨µ µ∂*cascade08
∂∏ ∏π*cascade08
πª ªº*cascade08
ºæ æø*cascade08
ø– –—*cascade08
—€ €ﬂ*cascade08
ﬂ®	 ®	´	*cascade08
´	‰	 ‰	Á	*cascade08
Á	ê
 ê
ë
*cascade08
ë
ï
 ï
ñ
*cascade08
ñ
¢
 ¢
£
*cascade08
£
≥
 ≥
¥
*cascade08
¥
π
 π
∫
*cascade08
∫
¡
 ¡
¬
*cascade08
¬
∆
 ∆
Ã
 *cascade08Ã
Œ
*cascade08Œ
–
 *cascade08–
—
*cascade08—
Ó
 *cascade08Ó

 *cascade08
˙
 *cascade08˙
˚
 *cascade08˚
˝
*cascade08˝
´ *cascade08´à *cascade08
àë ëí*cascade08
íì ìï*cascade08
ïñ ñó*cascade08
óô ôù*cascade08
ùû û°*cascade08
°∑ ∑∏*cascade08
∏‹ ‹›*cascade08
›É É°*cascade08
°∏ ∏ª*cascade08
ªº º√*cascade08
√ƒ ƒ÷ *cascade08÷Ÿ*cascade08Ÿ„ *cascade08
„Ù Ùı *cascade08
ıá áà*cascade08
àã ãú*cascade08
ú† †°*cascade08
°¢ ¢£*cascade08
£§ §¶*cascade08
¶ÿ ÿ‡*cascade08
‡‚ ‚Ë*cascade08
ËÙ Ù˜*cascade08
˜ò òô*cascade08
ô≤ ≤≥ *cascade08≥µ*cascade08µ∂ *cascade08∂∫*cascade08∫ª *cascade08ªº*cascade08ºæ *cascade08æø*cascade08ø¿ *cascade08¿¬*cascade08¬  *cascade08 œ*cascade08œ– *cascade08–—*cascade08—“ *cascade08
“” ”‘*cascade08
‘÷ ÷ÿ*cascade08
ÿŸ Ÿ€*cascade08
€› ›„*cascade08„‰ *cascade08‰Â*cascade08ÂÊ *cascade08ÊÁ*cascade08ÁÈ *cascade08ÈÍ*cascade08ÍÔ *cascade08Ô*cascade08Ò *cascade08ÒÚ*cascade08ÚÛ *cascade08ÛÙ*cascade08
Ùı ı˙*cascade08
˙˚ ˚ˇ*cascade08
ˇÉ ÉÑ*cascade08
Ñá áà*cascade08
àâ âé*cascade08éê *cascade08êë*cascade08ëì *cascade08ìó*cascade08óò *cascade08òô*cascade08ôõ *cascade08õû*cascade08ûü *cascade08ü°*cascade08°£ *cascade08£¶*cascade08¶® *cascade08®¨*cascade08¨¯ *cascade08¯Ä*cascade08Ä© *cascade08©≠*cascade08≠Ø *cascade08Ø±*cascade08±≤ *cascade08≤º*cascade08ºΩ *cascade08Ωæ*cascade08æ‘ *cascade08‘⁄*cascade08
⁄¯ ¯˘*cascade08
˘˙ ˙Ç*cascade08
ÇÑ Ñí*cascade08
íì ìñ *cascade08ñõ*cascade08õ† *cascade08†°*cascade08°® *cascade08®¨*cascade08
¨ƒ ƒ≈ *cascade08≈ı *cascade08ıˆˆ˘ *cascade08˘˝*cascade08˝ò *cascade08òô *cascade08ôõõú *cascade08
úù ù†*cascade08†° *cascade08°¶ *cascade08¶©©≠ *cascade08≠œ*cascade08œ– *cascade08–ÿÿŸ *cascade08Ÿ‡ *cascade08‡„„‰ *cascade08‰Â*cascade08ÂÊ *cascade08ÊÁ*cascade08ÁÈÈÎ *cascade08
Î˜ ˜”*cascade08
”’ ’Û*cascade08
Ûõ õû*cascade08
û§ §• *cascade08•‹‹ﬁ *cascade08ﬁ··‚ *cascade08‚‰‰Â *cascade08Âóóò *cascade08òúúù *cascade08ù™™¨ *cascade08¨ªª» *cascade08
»⁄ ⁄˘ *cascade08
˘ﬂ ﬂ‡ *cascade08
‡Í ÍÎ *cascade08
ÎÔ Ô˜*cascade08
˜Å Åá*cascade08
áà àì*cascade08
ìï ïñ *cascade08
ñ∏ ∏π*cascade08
πæ æƒ*cascade08
ƒ≈ ≈«*cascade08
«ˇ ˇÇ*cascade08
Çƒ ƒ≈*cascade08
≈∆ ∆« *cascade08
«Õ Õœ*cascade08
œ‘ ‘’ *cascade08
’€ €‹*cascade08‹› *cascade08›ﬁﬁﬂ *cascade08
ﬂ· ·‰*cascade08
‰Ê ÊÁ*cascade08
ÁÈ ÈÍ*cascade08
ÍÎ ÎÏ*cascade08ÏÌ *cascade08
ÌÓ Ó*cascade08
Ò ÒÚ*cascade08
Úˆ ˆ˜ *cascade08˜ààâ *cascade08
âç çé*cascade08
éè èó*cascade08
óò òö*cascade08
öú úû*cascade08ûü *cascade08ü•*cascade08
•¶ ¶™*cascade08™´ *cascade08´¨*cascade08¨≠ *cascade08
≠Æ Æ∞*cascade08∞± *cascade08±∏*cascade08
∏π π∫*cascade08∫ª *cascade08
ªø ø¿*cascade08
¿¡ ¡«*cascade08
«   Ã*cascade08
ÃŒ Œ– *cascade08–”*cascade08”÷÷◊ *cascade08
◊ÿ ÿ⁄*cascade08
⁄€ €Ë*cascade08
ËÈ ÈÍ*cascade08
ÍÔ Ô *cascade08
˝ ˝Ä*cascade08
ÄÇ ÇÉ *cascade08ÉÖ *cascade08
ÖÔ Ôá*cascade08
á† †®*cascade08
®© ©´*cascade08
´≥ ≥â *cascade08âë *cascade08ëõ *cascade08õú*cascade08ú∫ *cascade08∫  *cascade08 Û *cascade08Û˙*cascade08˙˚ *cascade08˚¸*cascade08¸Ä  *cascade08Ä ä *cascade08ä ñ  *cascade08ñ † *cascade08† æ  *cascade08æ « *cascade08« »  *cascade08» …  *cascade08… ‘ *cascade08
‘ Ÿ  Ÿ · *cascade08
· ˛  ˛ ë!*cascade08ë!∞! *cascade08∞!±!*cascade08±!π! *cascade08π!∫!*cascade08∫!À! *cascade08À!–!*cascade08–!÷! *cascade08÷!Ÿ!*cascade08Ÿ!⁄! *cascade08⁄!›!*cascade08›!ﬁ! *cascade08ﬁ!Ê!*cascade08Ê!Á! *cascade08Á!Ì!*cascade08Ì!ê" *cascade08ê"ú"*cascade08ú"£" *cascade08£"§"*cascade08
§"Ω" Ω"«" *cascade08«"‡" *cascade08‡"·"*cascade08·"‚" *cascade08‚"„"*cascade08„"Â" *cascade08Â"Ê"*cascade08Ê"Ë" *cascade08Ë"È"*cascade08È"Î" *cascade08Î"Ï"*cascade08Ï"Ì" *cascade08Ì"Ó"*cascade08Ó"Ô" *cascade08Ô"Ò"*cascade08Ò"ı" *cascade08ı"ˆ"*cascade08ˆ"Ç# *cascade08Ç#É#*cascade08É#è# *cascade08è#ë#*cascade08ë#í# *cascade08
í#ì# ì#î#*cascade08î#ñ# *cascade08ñ#ô# *cascade08ô#ö# *cascade08ö#õ#*cascade08õ#û# *cascade08
û#¢# ¢#£#*cascade08
£#´# ´#¨#*cascade08
¨#≥# ≥#¥#*cascade08
¥#∏# ∏#π# *cascade08π#ª#*cascade08ª#Ω# *cascade08Ω#æ#*cascade08
æ#ø# ø#¿# *cascade08¿#¬# *cascade08¬#√#*cascade08√#ƒ# *cascade08ƒ#≈#*cascade08≈#∆# *cascade08∆#«#*cascade08«#»# *cascade08»#…#*cascade08…#À# *cascade08À#Õ#*cascade08Õ#”# *cascade08
”#Ë# Ë#Ì# *cascade08Ì#Ó# *cascade08
Ó#ˇ# ˇ#Ü$ *cascade08Ü$ë$ *cascade08ë$°$ *cascade08°$¢$ *cascade08¢$£$ *cascade08
£$¶$ ¶$ß$ *cascade08ß$®$ *cascade08
®$©$ ©$¥$ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72•file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/TemplateNavigation.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version