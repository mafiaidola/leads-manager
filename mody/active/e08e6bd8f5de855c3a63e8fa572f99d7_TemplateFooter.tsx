ó."use client";

/**
 * Template Footer - Dynamic footer with proper hierarchy
 * Fixed: Logo sizing, proper brand column layout
 * ~100 lines - Under limit âœ…
 */

import Link from "next/link";
import { useBuilderMode } from "./BuilderModeContext";
import { EditableElement } from "./EditableElement";
import { FooterLinkColumn, FooterLink, defaultShopLinks, defaultSupportLinks, defaultCompanyLinks } from "./FooterLinkColumn";

interface FooterProps {
    storeName?: string;
    tagline?: string;
    logoUrl?: string;
    footerLogoUrl?: string;
    useNavLogo?: boolean;
    shopLinks?: FooterLink[];
    supportLinks?: FooterLink[];
    companyLinks?: FooterLink[];
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    youtubeUrl?: string;
    privacyUrl?: string;
    termsUrl?: string;
    copyright?: string;
    onStoreNameChange?: (value: string) => void;
    onTaglineChange?: (value: string) => void;
    onCopyrightChange?: (value: string) => void;
    onLinkClick?: (url: string) => void;
}

export function TemplateFooter({
    storeName = "LUXE KICKS",
    tagline = "Premium footwear for the modern lifestyle.",
    logoUrl, footerLogoUrl, useNavLogo = true,
    shopLinks = defaultShopLinks, supportLinks = defaultSupportLinks, companyLinks = defaultCompanyLinks,
    facebookUrl, instagramUrl, twitterUrl, youtubeUrl,
    privacyUrl = "/privacy", termsUrl = "/terms", copyright,
    onStoreNameChange, onTaglineChange, onCopyrightChange, onLinkClick
}: FooterProps) {
    const displayLogo = useNavLogo ? logoUrl : footerLogoUrl;
    const { isMobilePreview, isBuilderMode } = useBuilderMode();
    const gridClass = isMobilePreview ? "grid-cols-2 gap-6" : "sm:grid-cols-2 lg:grid-cols-4 gap-8";
    const currentYear = new Date().getFullYear();
    const copyrightText = copyright || `Â© ${currentYear} ${storeName}. All rights reserved.`;

    const socialLinks = [
        { icon: "ðŸ“˜", url: facebookUrl, label: "Facebook" },
        { icon: "ðŸ“¸", url: instagramUrl, label: "Instagram" },
        { icon: "ðŸ¦", url: twitterUrl, label: "Twitter" },
        { icon: "ðŸ“º", url: youtubeUrl, label: "YouTube" },
    ].filter(s => s.url);

    return (
        <footer className="bg-[#111111] border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className={`grid ${gridClass}`}>
                    {/* Brand Column - Fixed hierarchy */}
                    <div className="space-y-4">
                        {/* Logo OR Store Name - Not both stacked */}
                        {displayLogo ? (
                            <img
                                src={displayLogo}
                                alt={storeName}
                                className="h-12 max-h-12 w-auto max-w-[150px] object-contain"
                            />
                        ) : (
                            <EditableElement elementId="footer-storename" elementType="heading" value={storeName} onValueChange={onStoreNameChange}>
                                <h3 className="text-white font-bold tracking-wider text-xl">{storeName}</h3>
                            </EditableElement>
                        )}

                        {/* Tagline - Always editable */}
                        <EditableElement elementId="footer-tagline" elementType="text" value={tagline} onValueChange={onTaglineChange}>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-[200px]">{tagline}</p>
                        </EditableElement>

                        {/* Social Links */}
                        <div className="flex items-center gap-3 pt-2">
                            {socialLinks.length > 0 ? socialLinks.map((s, i) => (
                                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-sm hover:bg-red-500 transition-colors" title={s.label}>{s.icon}</a>
                            )) : ["ðŸ“˜", "ðŸ“¸", "ðŸ¦", "ðŸ“º"].map((icon, i) => (
                                <button key={i} className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-sm hover:bg-red-500 transition-colors">{icon}</button>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    <FooterLinkColumn title="Shop" links={shopLinks} isBuilderMode={isBuilderMode} onLinkClick={onLinkClick} />
                    <FooterLinkColumn title="Support" links={supportLinks} isBuilderMode={isBuilderMode} onLinkClick={onLinkClick} />
                    <FooterLinkColumn title="Company" links={companyLinks} isBuilderMode={isBuilderMode} onLinkClick={onLinkClick} />
                </div>

                {/* Footer Bottom - Copyright editable */}
                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <EditableElement elementId="footer-copyright" elementType="text" value={copyrightText} onValueChange={onCopyrightChange}>
                        <p className="text-gray-500 text-sm">{copyrightText}</p>
                    </EditableElement>
                    <div className="flex gap-4 text-sm">
                        {isBuilderMode ? (
                            <><span className="text-gray-500 hover:text-white transition-colors cursor-pointer">Privacy</span><span className="text-gray-500 hover:text-white transition-colors cursor-pointer">Terms</span></>
                        ) : (
                            <><Link href={privacyUrl} className="text-gray-500 hover:text-white transition-colors">Privacy</Link><Link href={termsUrl} className="text-gray-500 hover:text-white transition-colors">Terms</Link></>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
) *cascade08)+*cascade08+- *cascade08-/*cascade08/< *cascade08<@*cascade08@A *cascade08AE*cascade08EF *cascade08FL*cascade08LM*cascade08MN *cascade08NP *cascade08PS*cascade08ST *cascade08TU *cascade08UV*cascade08VW *cascade08WX*cascade08X_*cascade08_` *cascade08`a*cascade08af*cascade08fg *cascade08gj*cascade08jk *cascade08kl*cascade08lm *cascade08mn *cascade08no*cascade08op *cascade08pq *cascade08qs*cascade08st *cascade08tu*cascade08uv *cascade08vw *cascade08w}*cascade08}~*cascade08~ *cascade08‚ *cascade08‚„ *cascade08„…*cascade08…‡ *cascade08‡ˆ *cascade08ˆŠ*cascade08Š‹ *cascade08‹Œ*cascade08Œ *cascade08 *cascade08*cascade08’ *cascade08’•*cascade08•– *cascade08–ž*cascade08ž¡ *cascade08¡¢ *cascade08¢£ *cascade08£Á*cascade08Áø *cascade08øù *cascade08ùú *cascade08ú*cascade08‘ *cascade08‘•*cascade08•– *cascade08– *cascade08 ¡ *cascade08¡¦*cascade08¦§ *cascade08§¶*cascade08¶Á *cascade08ÁÈ*cascade08ÈÉ *cascade08ÉÔ*cascade08ÔÕ *cascade08ÕÚ*cascade08ÚÛ *cascade08Ûê*cascade08êë *cascade08ëì*cascade08ìî *cascade08îó*cascade08óô *cascade08ôö*cascade08öø *cascade08øû*cascade08ûü *cascade08ü€*cascade08€ *cascade08“*cascade08“” *cascade08”–*cascade08–— *cascade08—*cascade08ž *cascade08žŸ*cascade08Ÿ  *cascade08 ¡*cascade08¡£ *cascade08£«*cascade08«® *cascade08®· *cascade08·¸ *cascade08¸¾*cascade08¾¿ *cascade08¿Â*cascade08ÂÃ *cascade08ÃÆ*cascade08ÆÇ *cascade08ÇÈ*cascade08ÈÉ *cascade08ÉÍ*cascade08ÍÏ *cascade08ÏÑ*cascade08ÑÒ *cascade08ÒÙ*cascade08ÙÚ *cascade08Úá*cascade08áâ *cascade08âã*cascade08ãä *cascade08äì*cascade08ìí *cascade08íï*cascade08ïð *cascade08ðø*cascade08øÄ *cascade08ÄÓ *cascade08ÓÚ *cascade08Úæ*cascade08æç *cascade08ç† *cascade08†‡ *cascade08‡‰*cascade08‰Š *cascade08Š*cascade08 *cascade08’*cascade08’“ *cascade08“•*cascade08•– *cascade08–® *cascade08®¯ *cascade08¯à*cascade08àˆ *cascade08ˆŠ *cascade08Š« *cascade08«¬ *cascade08¬°*cascade08°Ê *cascade08ÊÎ*cascade08Î†	 *cascade08†	‡	 *cascade08‡	¶	 *cascade08¶	— *cascade08—º *cascade08º¾ *cascade08¾Ñ*cascade08ÑÚ *cascade08ÚÛ*cascade08Ûé *cascade08éì *cascade08ì« *cascade08«¯ *cascade08¯Æ *cascade08ÆÕ*cascade08Õð *cascade08ðò*cascade08òó *cascade08óõ*cascade08õö *cascade08ö…*cascade08…Š *cascade08Š‹*cascade08‹‘ *cascade08‘“*cascade08“” *cascade08”*cascade08ž *cascade08ž *cascade08 ¡ *cascade08¡¸*cascade08¸¹ *cascade08¹Á*cascade08ÁÅ *cascade08ÅÜ*cascade08ÜÝ *cascade08Ýà*cascade08àá *cascade08áæ*cascade08æç *cascade08çô*cascade08ôõ *cascade08õþ*cascade08þÿ *cascade08ÿƒ *cascade08ƒâ*cascade08âã *cascade08ãê *cascade08êì *cascade08ìñ*cascade08ñò *cascade08òø*cascade08øù *cascade08ù‰*cascade08‰Š *cascade08Šš*cascade08š› *cascade08›¦*cascade08¦§ *cascade08§»*cascade08»¼ *cascade08¼¾*cascade08¾Â *cascade08ÂÇ*cascade08ÇÉ *cascade08ÉÚ*cascade08ÚÝ *cascade08Ýæ*cascade08æç *cascade08çô*cascade08ôö *cascade08ö‡*cascade08‡ˆ *cascade08ˆ¦*cascade08¦¨ *cascade08¨„*cascade08„… *cascade08…‰*cascade08‰Š *cascade08Š’ *cascade08’– *cascade08–Ä *cascade08ÄÆ*cascade08ÆË *cascade08ËÍ*cascade08ÍÑ *cascade08ÑÒ*cascade08ÒÓ *cascade08ÓÔ*cascade08ÔÖ *cascade08ÖÙ*cascade08Ùï *cascade08ï€ *cascade08€’*cascade08’ª *cascade08ª® *cascade08®Ä*cascade08ÄÅ *cascade08ÅÞ *cascade08Þæ*cascade08æç *cascade08çé*cascade08éê *cascade08êë*cascade08ëì *cascade08ìî*cascade08îï *cascade08ïò*cascade08òö *cascade08ö÷ *cascade08÷ú*cascade08úû *cascade08ûÿ*cascade08ÿ€ *cascade08€‡*cascade08‡ˆ *cascade08ˆŒ*cascade08Œ¾ *cascade08¾Ö*cascade08Öí *cascade08íõ*cascade08õ‡ *cascade08‡ˆ*cascade08ˆ‹ *cascade08‹Œ *cascade08Œ¨ *cascade08¨·*cascade08·¼ *cascade08¼ã *cascade08ãê*cascade08êì *cascade08ìí*cascade08íî *cascade08îð*cascade08ðñ *cascade08ñõ*cascade08õö *cascade08öú*cascade08úü *cascade08üƒ*cascade08ƒ„ *cascade08„…*cascade08…‡ *cascade08‡‹*cascade08‹ *cascade08Ž*cascade08Ž *cascade08 *cascade08‘*cascade08‘’ *cascade08’“*cascade08“” *cascade08”•*cascade08•² *cascade08²Í*cascade08ÍÎ *cascade08ÎÒ*cascade08Òï *cascade08ï…*cascade08…† *cascade08†“*cascade08“— *cascade08—˜*cascade08˜› *cascade08›¢*cascade08¢£ *cascade08£§*cascade08§¨ *cascade08¨®*cascade08®° *cascade08°²*cascade08²Ç *cascade08ÇÌ*cascade08Ìˆ *cascade08ˆ‰ *cascade08‰‹*cascade08‹º *cascade08ºÀ *cascade08ÀÁ*cascade08ÁÂ *cascade08ÂÄ *cascade08ÄÏ*cascade08ÏÑ *cascade08ÑÓ*cascade08Óí *cascade08íñ *cascade08ñƒ*cascade08ƒœ *cascade08œ¹*cascade08¹º *cascade08ºÎ*cascade08ÎÐ *cascade08ÐÙ*cascade08ÙÚ *cascade08Úò *cascade08ò÷*cascade08÷ø *cascade08øù*cascade08ùû *cascade08û‚*cascade08‚ƒ *cascade08ƒ*cascade08 *cascade08–*cascade08–œ *cascade08œ£*cascade08£¤ *cascade08¤¨*cascade08¨© *cascade08©«*cascade08«¯ *cascade08¯°*cascade08°Ã *cascade08ÃÈ*cascade08Èà *cascade08àã *cascade08ãä *cascade08äˆ*cascade08ˆŠ *cascade08Š*cascade08Ž *cascade08Ž*cascade08 *cascade08™*cascade08™š *cascade08šŸ*cascade08Ÿ  *cascade08 ¢ *cascade08¢©*cascade08©ª *cascade08ª±*cascade08±¿*cascade08¿Â *cascade08ÂÃ *cascade08ÃÅ*cascade08ÅÆ *cascade08ÆÈ*cascade08ÈÉ *cascade08ÉÊ*cascade08ÊÎ *cascade08Îç *cascade08çè*cascade08èé *cascade08éë*cascade08ëì *cascade08ìí*cascade08íî *cascade08îï*cascade08ïð *cascade08ðö*cascade08ö÷ *cascade08÷ù*cascade08ù§*cascade08§¨ *cascade08¨» *cascade08»À*cascade08ÀÕ *cascade08Õâ*cascade08âç *cascade08çì*cascade08ìŒ *cascade08Œž*cascade08žŸ *cascade08Ÿ *cascade08 ¡ *cascade08¡¤*cascade08¤¥ *cascade08¥°*cascade08°¶ *cascade08¶·*cascade08·â *cascade08âã*cascade08ãì *cascade08ì£*cascade08£° *cascade08°±*cascade08±´ *cascade08´µ*cascade08µ› *cascade08›«*cascade08«­ *cascade08­¯*cascade08¯¶ *cascade08¶·*cascade08·Ø *cascade08ØÙ*cascade08ÙÚ *cascade08Úâ*cascade08âã *cascade08ãê*cascade08êë *cascade08ëò*cascade08òó *cascade08óú*cascade08ú  *cascade08 „ *cascade08„ ¯  *cascade08¯ ½ *cascade08½ É  *cascade08É Ë  *cascade08Ë Ì *cascade08Ì Ï  *cascade08Ï Ð *cascade08Ð ì  *cascade08ì î  *cascade08î ð *cascade08ð ñ  *cascade08ñ ô *cascade08ô õ  *cascade08õ ø *cascade08ø ú  *cascade08ú û *cascade08û ü  *cascade08ü !*cascade08!‚! *cascade08‚!†!*cascade08†!ˆ! *cascade08ˆ!!*cascade08!! *cascade08!”!*cascade08”!•! *cascade08•!ž!*cascade08ž!Ÿ! *cascade08Ÿ!£!*cascade08£!¤! *cascade08¤!¥!*cascade08¥!§! *cascade08§!¨!*cascade08¨!©! *cascade08©!®!*cascade08®!¯! *cascade08¯!µ!*cascade08µ!¹! *cascade08¹!¼!*cascade08¼!¿! *cascade08¿!Å!*cascade08Å!ã! *cascade08ã!æ!*cascade08æ!ÿ! *cascade08ÿ!†"*cascade08†"š" *cascade08š" " *cascade08 "¡" *cascade08¡"Ë"*cascade08Ë"ß" *cascade08ß"â"*cascade08â"ã" *cascade08ã"æ"*cascade08æ"ç"*cascade08ç"è" *cascade08è"é"*cascade08é"ê" *cascade08ê"ì"*cascade08ì"í" *cascade08í"ï"*cascade08ï"ñ" *cascade08ñ"ô"*cascade08ô"ø" *cascade08ø"ù"*cascade08ù"û" *cascade08û"ý"*cascade08ý"þ" *cascade08þ"ÿ"*cascade08ÿ"# *cascade08#‚#*cascade08‚#ƒ# *cascade08ƒ#„#*cascade08„#…# *cascade08…#Š#*cascade08Š## *cascade08#Ž#*cascade08Ž## *cascade08##*cascade08#È#*cascade08È#ß# *cascade08ß#à# *cascade08à#æ#*cascade08æ#ð# *cascade08ð#ñ# *cascade08ñ#€$*cascade08€$$ *cascade08$”$*cascade08”$–$ *cascade08–$Î$*cascade08Î$æ$ *cascade08æ$ì$*cascade08ì$í$*cascade08í$î$ *cascade08î$ö$*cascade08ö$÷$ *cascade08÷$†%*cascade08†%‡% *cascade08‡%š%*cascade08š%Ò%*cascade08Ò%Ó% *cascade08Ó%Ö%*cascade08Ö%î% *cascade08î%ª&*cascade08ª&Á' *cascade08Á'Ó(*cascade08Ó(÷( *cascade08÷() *cascade08)‚)*cascade08‚)ƒ) *cascade08ƒ)„)*cascade08„)†) *cascade08†)‹)*cascade08‹)Œ) *cascade08Œ)›)*cascade08›)) *cascade08)£)*cascade08£)¥) *cascade08¥)¨)*cascade08¨)©) *cascade08©)«)*cascade08«)¬) *cascade08¬)­)*cascade08­)®) *cascade08®)°)*cascade08°)ƒ* *cascade08ƒ*²**cascade08²*³* *cascade08³*·**cascade08·*¸* *cascade08¸*¹**cascade08¹*õ* *cascade08õ*„+*cascade08„++ *cascade08+‘+*cascade08‘+’+ *cascade08’+“+*cascade08“+”+ *cascade08”+“,*cascade08“,¬, *cascade08¬,°,*cascade08°,±, *cascade08±,·,*cascade08·,½, *cascade08½,Ô,*cascade08Ô,Õ, *cascade08Õ,…-*cascade08…-†- *cascade08†-ª-*cascade08ª-ï- *cascade08ï-ö-*cascade08ö-÷- *cascade08÷-’.*cascade08’.ó. *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¡file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/TemplateFooter.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version