«0"use client";

/**
 * Template Hero - Premium dark theme hero with large product
 * ~120 lines - AI friendly (buttons split to HeroButtons.tsx)
 */

import Image from "next/image";
import { useCart } from "./CartProvider";
import { useRouter } from "next/navigation";
import { useBuilderMode } from "./BuilderModeContext";
import { EditableElement } from "./EditableElement";
import { HeroButtons } from "./HeroButtons";

interface TemplateHeroProps {
    title?: string;
    subtitle?: string;
    price?: number;
    originalPrice?: number;
    buttonText?: string;
    secondaryButtonText?: string;
    buttonColor?: string;
    imageUrl?: string;
    selectedColor?: string;
    titleColor?: string;
    subtitleColor?: string;
    titleBgColor?: string;
    subtitleBgColor?: string;
    onTitleChange?: (value: string) => void;
    onSubtitleChange?: (value: string) => void;
    onTitleColorChange?: (color: string) => void;
    onSubtitleColorChange?: (color: string) => void;
    onTitleBgColorChange?: (color: string) => void;
    onSubtitleBgColorChange?: (color: string) => void;
    onButtonTextChange?: (value: string) => void;
    onSecondaryButtonTextChange?: (value: string) => void;
    onImageClick?: () => void;
    onColorSelect?: (color: string) => void;
}

const colorOptions = ["#E53935", "#FFFFFF", "#1a1a1a", "#3B82F6"];

export function TemplateHero({
    title = "PREMIUM COLLECTION 2024",
    subtitle = "Discover the Future of Footwear. Limited Edition.",
    price = 199, originalPrice = 249,
    buttonText = "BUY NOW", secondaryButtonText = "ADD TO CART",
    buttonColor = "#E53935", imageUrl = "/template-products/sneaker-5.png",
    selectedColor = "#E53935", titleColor = "#ffffff", subtitleColor = "#9ca3af",
    titleBgColor = "transparent", subtitleBgColor = "transparent",
    onTitleChange, onSubtitleChange, onTitleColorChange, onSubtitleColorChange,
    onTitleBgColorChange, onSubtitleBgColorChange,
    onButtonTextChange, onSecondaryButtonTextChange, onImageClick, onColorSelect,
}: TemplateHeroProps) {
    const { addItem } = useCart();
    const router = useRouter();
    const { isBuilderMode, isMobilePreview } = useBuilderMode();

    const handleAddToCart = () => {
        if (isBuilderMode) return;
        addItem({ id: "hero-1", name: "PREMIUM COLLECTION SNEAKER", price, image: "/template-products/sneaker-5.png" });
    };

    const handleBuyNow = () => {
        if (isBuilderMode) return;
        handleAddToCart();
        router.push("/newlayout1/preview/checkout");
    };

    return (
        <section className="bg-[#1a1a1a] min-h-[80vh] relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-gray-500 rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-gray-500 rounded-full" />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 relative z-10">
                <div className={`grid ${isMobilePreview ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8 items-center`}>
                    <div className={isMobilePreview ? 'text-center' : 'text-center md:text-left'}>
                        {/* Editable Title with Text + BG color */}
                        <EditableElement elementId="hero-title" elementType="heading" value={title} onValueChange={onTitleChange} textColor={titleColor} bgColor={titleBgColor} onTextColorChange={onTitleColorChange} onBgColorChange={onTitleBgColorChange}>
                            <h1 className="text-4xl md:text-6xl font-bold mb-4 italic" style={{ color: titleColor }}>{title}</h1>
                        </EditableElement>

                        {/* Editable Subtitle with Text + BG color */}
                        <EditableElement elementId="hero-subtitle" elementType="text" value={subtitle} onValueChange={onSubtitleChange} textColor={subtitleColor} bgColor={subtitleBgColor} onTextColorChange={onSubtitleColorChange} onBgColorChange={onSubtitleBgColorChange}>
                            <p className="text-lg mb-8" style={{ color: subtitleColor }}>{subtitle}</p>
                        </EditableElement>

                        <div className={`flex items-baseline gap-3 mb-6 ${isMobilePreview ? 'justify-center' : 'justify-center md:justify-start'}`}>
                            <span className="text-red-500 text-4xl font-bold">${price}</span>
                            {originalPrice && <span className="text-gray-500 text-xl line-through">${originalPrice}</span>}
                        </div>

                        <HeroButtons
                            buttonText={buttonText} secondaryButtonText={secondaryButtonText}
                            buttonColor={buttonColor} selectedColor={selectedColor}
                            colorOptions={colorOptions} isBuilderMode={isBuilderMode} isMobilePreview={isMobilePreview}
                            onAddToCart={handleAddToCart} onBuyNow={handleBuyNow}
                            onButtonTextChange={onButtonTextChange} onSecondaryButtonTextChange={onSecondaryButtonTextChange}
                            onColorSelect={onColorSelect}
                        />
                    </div>

                    <div className="flex justify-center">
                        <div className="relative w-full max-w-lg">
                            <EditableElement elementId="hero-image" elementType="image">
                                <div onClick={onImageClick} className={`aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden relative ${onImageClick ? 'cursor-pointer hover:ring-2 hover:ring-red-500' : ''}`}>
                                    <Image src={imageUrl} alt="Hero Product" fill className="object-contain p-8" />
                                </div>
                            </EditableElement>
                            <div className="absolute -bottom-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">EXCLUSIVE</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
T *cascade08TT*cascade08Tí *cascade08íî *cascade08î¥¥∏ *cascade08∏∫ *cascade08∫¿*cascade08¿¡ *cascade08¡≈*cascade08≈∆ *cascade08∆⁄*cascade08⁄€ *cascade08€ﬂ *cascade08ﬂÂ*cascade08ÂÊ *cascade08Ê˛*cascade08˛ˇ *cascade08ˇã*cascade08ãå *cascade08å¯¯•*cascade08•ü *cascade08
ü¯ ¯è*cascade08è´*cascade08´‹ *cascade08‹ï*cascade08ïô *cascade08
ôﬂ ﬂ∆*cascade08
∆Ÿ Ÿƒ*cascade08
ƒ±	 ±	–	*cascade08–	˝	*cascade08˝	ó
 *cascade08ó
ù
*cascade08ù
¢
 *cascade08¢
©
*cascade08©
≠
 *cascade08≠
±
*cascade08±
≤
 *cascade08≤
≥
*cascade08≥
∏
 *cascade08∏
ø
*cascade08ø
‚
 *cascade08‚
Ê
Ê
â *cascade08âççÕ *cascade08Õ——Ú *cascade08ÚÙÙı *cascade08
ı— —Å *cascade08Åü *cascade08
ü† †” *cascade08”ñ*cascade08ñö *cascade08
ö≥ ≥ﬁ *cascade08
ﬁÊ Êô*cascade08
ôÎ Î¬ *cascade08
¬ﬂ ﬂ*cascade08
É Éä *cascade08äã *cascade08ãç*cascade08çè *cascade08èò*cascade08ò° *cascade08°¥ *cascade08¥◊◊Ì *cascade08ÌÔ *cascade08Ôò *cascade08ò√√’ *cascade08’◊ *cascade08◊‡*cascade08‡Á *cascade08ÁÒ *cascade08Òîîõ *cascade08õú *cascade08ú•*cascade08•¶ *cascade08¶ª*cascade08ªº *cascade08ºæ*cascade08æø *cascade08ø»*cascade08»  *cascade08 Õ*cascade08ÕŒ *cascade08Œ“*cascade08“” *cascade08”’*cascade08’÷ *cascade08÷›*cascade08›ﬁ *cascade08ﬁ·*cascade08·‚ *cascade08‚Ê*cascade08ÊÁ *cascade08ÁÎ*cascade08ÎÎ *cascade08Îá*cascade08áã *cascade08ãì*cascade08ìî *cascade08îó*cascade08ó• *cascade08•ß*cascade08ß∫ *cascade08∫º*cascade08º· *cascade08·Ö*cascade08Öù *cascade08ùü*cascade08üπ *cascade08
πÃ Ã·*cascade08
·Ê Ê˛ *cascade08˛ï*cascade08ïØ *cascade08Ø÷*cascade08÷‚ *cascade08
‚Ä Ä∫ *cascade08∫ÿ*cascade08ÿˇ *cascade08
ˇ¿ ¿’*cascade08
’‡ ‡˚ *cascade08˚ï*cascade08ï≤ *cascade08≤‹*cascade08‹Ë *cascade08
Ëá  á ô  *cascade08ô ö *cascade08ö õ  *cascade08õ û *cascade08û ü  *cascade08ü ° *cascade08° ¢  *cascade08¢ £ *cascade08£ §  *cascade08§ ¶ *cascade08¶ ß  *cascade08ß ≠ *cascade08≠ Æ  *cascade08Æ ± *cascade08± ≤  *cascade08≤ ¥ *cascade08¥ µ  *cascade08µ ¬ *cascade08¬ —  *cascade08— ˝ ˝ •! *cascade08•!ß!*cascade08ß!∆! *cascade08∆!Ó!*cascade08Ó!ç" *cascade08ç"ë"*cascade08ë"å$ *cascade08å$ç$ç$¶$ *cascade08¶$ß$*cascade08ß$®$ *cascade08®$™$ *cascade08
™$∞$ ∞$±$*cascade08
±$œ$ œ$–$*cascade08
–$÷$ ÷$ÿ$*cascade08
ÿ$Ÿ$ Ÿ$⁄$*cascade08⁄$‡$ *cascade08‡$Â$*cascade08
Â$˚$ ˚$¸$*cascade08
¸$≤% ≤%Ω%*cascade08Ω%¿% *cascade08¿%¡%*cascade08¡%¬% *cascade08¬% %*cascade08 %À% *cascade08À%”%*cascade08”%’% *cascade08’%◊%*cascade08◊%Ÿ% *cascade08Ÿ%‹%*cascade08‹%ﬁ% *cascade08ﬁ%·%*cascade08·%„% *cascade08
„%Ä& Ä&Ç& *cascade08Ç&É&*cascade08É&Ö& *cascade08Ö&á&*cascade08á&ã& *cascade08ã&è&*cascade08è&ì& *cascade08ì&ï&*cascade08ï&ñ& *cascade08ñ&ó&*cascade08ó&ö& *cascade08ö&ú&*cascade08ú&ù& *cascade08ù&†&*cascade08†&¢& *cascade08¢&§&*cascade08§&•& *cascade08•&™&*cascade08
™&∏& ∏&π&*cascade08
π&∫& ∫&ª&*cascade08
ª&º& º&Ω&*cascade08
Ω&æ& æ&√&*cascade08
√&ƒ& ƒ&«&*cascade08
«&»& »& &*cascade08
 &À& À&Ã&*cascade08
Ã&Õ& Õ&“&*cascade08
“&”& ”&‘&*cascade08
‘&÷& ÷&⁄&*cascade08
⁄&Á& Á&Ë& *cascade08
Ë&¯& ¯&˙& *cascade08˙&¸&*cascade08
¸&˝& ˝&Ç'*cascade08
Ç'É' É'Ü'*cascade08
Ü'ã' ã'ë'*cascade08
ë'ì' ì'î' *cascade08î'ñ'*cascade08ñ'ò' *cascade08
ò'û' û'°'*cascade08
°'£' £'§'*cascade08
§'¶' ¶'ß'*cascade08
ß'©' ©'™'*cascade08
™'¨' ¨'≠'*cascade08
≠'Ã' Ã'Õ'*cascade08
Õ'Ù' Ù'ı'*cascade08ı'ˆ' *cascade08ˆ'¸' *cascade08
¸'á( á(â(*cascade08
â(ã( ã(å(*cascade08å(é( *cascade08é(è( *cascade08è(ë( *cascade08ë(í(*cascade08í(ì( *cascade08ì(î( *cascade08î(ï(*cascade08ï(ô( *cascade08ô(õ(*cascade08õ(†( *cascade08†(°(*cascade08°(¢( *cascade08¢(£(*cascade08£(§(*cascade08§(•( *cascade08•(ß(*cascade08ß(®( *cascade08®(©(*cascade08©(»( *cascade08»( ( *cascade08 (œ(*cascade08œ(–(*cascade08–(—( *cascade08
—(’( ’(◊( *cascade08◊(ﬁ( *cascade08
ﬁ(‰( ‰(Â( *cascade08
Â(˛( ˛(ˇ( *cascade08ˇ(ú) *cascade08ú)ù)ù)∑* *cascade08∑*î+î+ò+ *cascade08ò+Ø+*cascade08Ø+π+ *cascade08π+ª+*cascade08ª+Å, *cascade08Å,Ö,Ö,á, *cascade08á,é,é,è, *cascade08è,ê,ê,ë, *cascade08ë,ï,ï,ñ, *cascade08ñ,ò,ò,ô, *cascade08ô,„,*cascade08
„,ã- ã-å- *cascade08å-ê-ê-ë- *cascade08ë-í-í-ì- *cascade08
ì-î- î-ñ-*cascade08
ñ-ò- ò-ô-*cascade08
ô-ö- ö-õ-*cascade08
õ-ú- ú-û-*cascade08
û-°- °-¢- *cascade08
¢-§- §-©-*cascade08
©-´- ´-≠-*cascade08
≠-Ø- Ø-∞- *cascade08∞-±-±-≤- *cascade08≤-«-«-»- *cascade08»-Ã-Ã-Õ- *cascade08Õ-“-“-”- *cascade08”-‘-‘-’- *cascade08’-◊-◊-ÿ- *cascade08ÿ-˘-˘-˛- *cascade08˛-≠.≠.«0 *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72üfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/TemplateHero.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version