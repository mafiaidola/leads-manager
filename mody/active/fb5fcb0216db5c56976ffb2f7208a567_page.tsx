ºN"use client";

/**
 * Product Detail Page - Full product view with gallery
 * Phase 1: Updated to use API via useProductDetail hook
 * Phase 2: Added stock validation and variant-specific images
 * UPDATED: Uses useBuilderSettings for consistent branding
 */

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { TemplateNavigation } from "../../TemplateNavigation";
import { TemplateFooter } from "../../TemplateFooter";
import { useProductDetail } from "../../builder/useProductDetail";
import { useCart } from "../../CartProvider";
import { CartDrawer } from "../../CartDrawer";
import { ProductImageGallery } from "../../ProductImageGallery";
import { useBuilderSettings } from "../../builder/useBuilderSettings";

// Helper to get human-readable color name from hex
function getColorName(hex: string): string {
    const colorMap: Record<string, string> = {
        "#E53935": "Red", "#e53935": "Red", "#FF0000": "Red", "#ff0000": "Red",
        "#1a1a1a": "Black", "#000000": "Black", "#000": "Black",
        "#FFFFFF": "White", "#ffffff": "White", "#fff": "White", "#FFF": "White",
        "#3B82F6": "Blue", "#0000FF": "Blue", "#2196F3": "Blue",
        "#22C55E": "Green", "#00FF00": "Green", "#4CAF50": "Green",
        "#FBBF24": "Yellow", "#FFFF00": "Yellow", "#FFC107": "Yellow",
        "#A855F7": "Purple", "#9C27B0": "Purple",
        "#EC4899": "Pink", "#E91E63": "Pink",
        "#F97316": "Orange", "#FF9800": "Orange",
        "#6B7280": "Gray", "#9CA3AF": "Gray", "#808080": "Gray",
        "#8B4513": "Brown", "#795548": "Brown",
        "#00BCD4": "Cyan", "#06B6D4": "Cyan",
    };
    return colorMap[hex] || colorMap[hex.toUpperCase()] || colorMap[hex.toLowerCase()] || hex;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addItem } = useCart();
    const { product, loading, error } = useProductDetail(params.id as string);
    const { navProps, footerProps } = useBuilderSettings();
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Compute stock status
    const stockQty = product?.inventory_quantity;
    const isOutOfStock = stockQty !== undefined && stockQty <= 0;
    const isLowStock = stockQty !== undefined && stockQty > 0 && stockQty <= 5;

    // Build images array with variant-specific image support
    const galleryImages: string[] = useMemo(() => {
        if (!product) return [];
        const selectedHex = product.colors?.[selectedColor];
        // If variant_images has a specific image for this color, use it first
        if (selectedHex && product.variant_images?.[selectedHex]) {
            const variantImg = product.variant_images[selectedHex];
            const otherImages = product.images?.map(img => typeof img === 'string' ? img : img.url).filter(url => url !== variantImg) || [];
            return [variantImg, ...otherImages].filter(Boolean) as string[];
        }
        // Fallback to standard images
        return product.images?.length
            ? product.images.map(img => typeof img === 'string' ? img : img.url).filter(Boolean) as string[]
            : [product.image].filter(Boolean) as string[];
    }, [product, selectedColor]);

    if (loading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div>;
    if (error || !product) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">{error || "Product not found"}</div>;

    const handleAddToCart = () => {
        if (!selectedSize || isOutOfStock) return;
        addItem({
            id: `${product.id}-${selectedColor}-${selectedSize}`,
            name: product.name,
            price: product.price,
            color: getColorName(product.colors[selectedColor]),
            size: selectedSize,
            image: galleryImages[0] || product.image // Use variant image if available
        }, quantity);
    };

    const handleBuyNow = () => { handleAddToCart(); router.push("/newlayout1/preview/checkout"); };

    return (
        <div className="min-h-screen bg-[#1a1a1a]">
            <TemplateNavigation {...navProps} />
            <CartDrawer />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <button onClick={() => router.back()} className="text-gray-400 hover:text-white mb-6">â† Back</button>
                <div className="grid md:grid-cols-2 gap-12">
                    <ProductImageGallery images={galleryImages} productName={product.name} />
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-400">{"â˜…".repeat(Math.floor(product.rating))}</span>
                            <span className="text-gray-400">({product.reviews} reviews)</span>
                        </div>
                        <p className="text-gray-400 mb-6">{product.description}</p>
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-3xl font-bold" style={{ color: "var(--theme-primary, #E53935)" }}>${product.price}</span>
                            {product.originalPrice && <span className="text-gray-500 text-xl line-through">${product.originalPrice}</span>}
                        </div>
                        {/* Stock Status */}
                        {isOutOfStock && <div className="mb-4 px-3 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm font-medium">âš ï¸ Out of Stock</div>}
                        {isLowStock && <div className="mb-4 px-3 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg text-sm font-medium">ğŸ”¥ Only {stockQty} left in stock!</div>}
                        {stockQty !== undefined && stockQty > 5 && <div className="mb-4 text-green-400 text-sm">âœ“ In Stock</div>}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-gray-400 text-sm">COLOR</span>
                                <span className="text-white text-sm font-medium">{getColorName(product.colors[selectedColor])}</span>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {product.colors.map((c, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedColor(i)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${i === selectedColor ? "ring-2 scale-110" : "border-gray-600 hover:border-gray-400"}`}
                                        style={i === selectedColor
                                            ? { backgroundColor: c, borderColor: "var(--theme-primary, #E53935)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--theme-primary, #E53935) 30%, transparent)" }
                                            : { backgroundColor: c }
                                        }
                                        title={getColorName(c)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <span className="text-gray-400 text-sm mb-2 block">SIZE</span>
                            <div className="flex flex-wrap gap-2">{product.sizes.map(s => <button key={s} onClick={() => setSelectedSize(s)} className={`px-4 py-2 border rounded-lg ${selectedSize === s ? "" : "border-gray-600 text-gray-400 hover:text-white"}`} style={selectedSize === s ? { borderColor: "var(--theme-primary, #E53935)", color: "var(--theme-primary, #E53935)" } : {}}>{s}</button>)}</div>
                        </div>
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-gray-400 text-sm">QTY</span>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 border border-gray-600 text-white rounded-lg" disabled={isOutOfStock}>-</button>
                            <span className="text-white w-8 text-center">{quantity}</span>
                            <button onClick={() => setQuantity(stockQty ? Math.min(stockQty, quantity + 1) : quantity + 1)} className="w-10 h-10 border border-gray-600 text-white rounded-lg" disabled={isOutOfStock}>+</button>
                            {stockQty !== undefined && quantity >= stockQty && <span className="text-orange-400 text-xs">Max available</span>}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleAddToCart} disabled={!selectedSize || isOutOfStock} className="flex-1 py-4 border-2 border-gray-400 text-white font-bold hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}</button>
                            <button onClick={handleBuyNow} disabled={!selectedSize || isOutOfStock} className="flex-1 py-4 text-white font-bold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: "var(--theme-primary, #E53935)", borderRadius: "var(--theme-border-radius, 0px)" }}>{isOutOfStock ? "UNAVAILABLE" : "BUY NOW"}</button>
                        </div>
                    </div>
                </div>
            </div>
            <TemplateFooter {...footerProps} />
        </div>
    );
}

C *cascade08CJ*cascade08JT *cascade08TU*cascade08UW *cascade08W^^` *cascade08`a*cascade08ab bd*cascade08de *cascade08ef *cascade08fl*cascade08lm *cascade08mp*cascade08pq *cascade08qr*cascade08rs *cascade08sƒ*cascade08ƒ† *cascade08†Å*cascade08Å• *cascade08•*cascade08ä *cascade08
äç ç *cascade08‘*cascade08‘É *cascade08ÉÌ*cascade08Ìæ *cascade08æè*cascade08èğ *cascade08ğö*cascade08ö‚ *cascade08‚…*cascade08…*cascade08— *cascade08—*cascade08¹ *cascade08¹¼*cascade08¼ê *cascade08êí*cascade08íı *cascade08ı» *cascade08»‚‚… *cascade08…† *cascade08†ß*cascade08ßú *cascade08úü*cascade08üƒ *cascade08ƒ•*cascade08•˜ *cascade08˜š*cascade08š¢ *cascade08¢¨*cascade08¨É *cascade08É……· *cascade08·Á*cascade08ÁÂ *cascade08ÂÄ*cascade08
ÄÅ ÅÊ*cascade08
ÊÍ ÍÏ*cascade08
ÏĞ ĞÒ*cascade08
ÒÔ ÔÖ*cascade08
Ö× ×Ù*cascade08
ÙÚ Úâ*cascade08
âã ãí*cascade08
íï ïğ*cascade08
ğò òù*cascade08
ùú úƒ*cascade08
ƒ„ „Š*cascade08
ŠŒ Œ*cascade08
 š*cascade08
š› ›*cascade08
 ª*cascade08
ª« «­*cascade08
­¯ ¯³*cascade08
³¶ ¶»*cascade08
»¼ ¼Ç*cascade08
ÇÈ ÈÉ*cascade08
ÉÊ ÊË*cascade08
ËÍ ÍÓ*cascade08
ÓÔ Ôê*cascade08
êë ëì*cascade08
ìí íî*cascade08
îğ ğó*cascade08
óô ô÷*cascade08
÷ø ø*cascade08
Ÿ Ÿ£*cascade08
£¤ ¤¦*cascade08
¦§ §«*cascade08
«¬ ¬´*cascade08
´µ µ¶*cascade08
¶¸ ¸¹*cascade08
¹½ ½¿*cascade08
¿À ÀÃ*cascade08
ÃÄ ÄÈ*cascade08
ÈÉ ÉË*cascade08
ËÌ ÌÒ*cascade08
ÒÔ ÔÕ*cascade08
ÕÖ Ö×*cascade08
×Ø Øà*cascade08
àâ âê*cascade08
êë ëí*cascade08
íî îø*cascade08
øù ùú*cascade08
úû û€*cascade08
€ ‚*cascade08
‚ƒ ƒ…*cascade08
…† †‡*cascade08
‡‹ ‹*cascade08
’ ’£ *cascade08£®*cascade08®° *cascade08°²*cascade08²³ *cascade08³µ*cascade08µ¶ *cascade08¶¸*cascade08¸º *cascade08º»*cascade08»¼ *cascade08¼¾*cascade08¾¿ *cascade08¿À*cascade08ÀÁ *cascade08ÁÂ*cascade08ÂÃ *cascade08ÃÍ*cascade08ÍÎ *cascade08ÎÕ*cascade08ÕÖ *cascade08Ö×*cascade08×Ù *cascade08ÙÚ*cascade08ÚÛ *cascade08Û÷*cascade08÷ù *cascade08ùş*cascade08şÿ *cascade08ÿ€*cascade08€ *cascade08ƒ*cascade08ƒ„ *cascade08„‹*cascade08‹ *cascade08*cascade08 *cascade08”*cascade08”• *cascade08•˜*cascade08˜ *cascade08¢*cascade08¢¤ *cascade08¤¥*cascade08¥¦ *cascade08¦§ *cascade08§©*cascade08©ª *cascade08ª«*cascade08«¯ *cascade08¯²*cascade08²³ *cascade08³¶*cascade08¶¼ *cascade08¼Á*cascade08ÁÂ *cascade08ÂÆ*cascade08ÆÇ *cascade08ÇÊ*cascade08ÊË *cascade08ËŞ*cascade08Şä *cascade08äô*cascade08ôõ *cascade08õù*cascade08ùû *cascade08û‡*cascade08‡ˆ *cascade08ˆ‹*cascade08‹Œ *cascade08Œ*cascade08*cascade08*cascade08 *cascade08“*cascade08“” *cascade08”•*cascade08•– *cascade08–—*cascade08—™ *cascade08™¦*cascade08¦« *cascade08«°*cascade08°± *cascade08±² *cascade08²³ *cascade08³Ê*cascade08ÊË *cascade08ËÌ*cascade08ÌÎ *cascade08ÎÑ*cascade08ÑÒ *cascade08ÒØ*cascade08ØÙ *cascade08Ùß*cascade08ßà *cascade08àè*cascade08èé *cascade08éù*cascade08ùú *cascade08úü*cascade08üı *cascade08ı†*cascade08†‡ *cascade08‡‰*cascade08‰Œ *cascade08Œœ*cascade08œ *cascade08£*cascade08£¤ *cascade08¤¬*cascade08¬­ *cascade08­¸*cascade08¸º *cascade08º¾*cascade08¾¿ *cascade08¿Ç*cascade08ÇÈ *cascade08ÈË*cascade08ËÏ *cascade08ÏÖ*cascade08Ö× *cascade08×Ú*cascade08ÚÛ *cascade08Ûå*cascade08åæ *cascade08æî*cascade08îö *cascade08öŠ*cascade08
Š“ “£*cascade08£¤ *cascade08¤Ô*cascade08Ôë *cascade08ëì *cascade08ìğ*cascade08ğ÷ *cascade08÷ˆ *cascade08ˆà*cascade08àá *cascade08áå*cascade08åõ *cascade08õ‘*cascade08‘” *cascade08”˜ *cascade08˜*cascade08Ÿ *cascade08Ÿ¢*cascade08¢£ *cascade08£¤*cascade08¤¥ *cascade08¥§*cascade08§© *cascade08©¬*cascade08¬­ *cascade08­°*cascade08°² *cascade08²³*cascade08³´ *cascade08´µ*cascade08µ¶ *cascade08¶·*cascade08·À *cascade08ÀÂ*cascade08ÂÄ *cascade08ÄÆ*cascade08ÆÏ *cascade08ÏÓ*cascade08ÓÔ *cascade08Ôë*cascade08ëì *cascade08ìø*cascade08øù *cascade08ùı*cascade08ış *cascade08şŠ*cascade08Š‹ *cascade08‹™*cascade08™š *cascade08šª*cascade08ª« *cascade08«­*cascade08­° *cascade08°¶*cascade08¶¸ *cascade08¸»*cascade08»¼ *cascade08¼À*cascade08ÀÁ *cascade08ÁÃ *cascade08ÃÄ*cascade08ÄÅ *cascade08ÅÍ*cascade08ÍÎ *cascade08ÎÙ*cascade08ÙÛ *cascade08Ûâ*cascade08âã *cascade08ãë*cascade08ëì *cascade08ìƒ*cascade08ƒ… *cascade08…‘*cascade08‘’ *cascade08’•*cascade08•– *cascade08–—*cascade08—˜ *cascade08˜™*cascade08™š *cascade08š*cascade08Ÿ *cascade08Ÿ·*cascade08·¸ *cascade08¸»*cascade08»½ *cascade08½Ë*cascade08ËÌ *cascade08ÌÏ*cascade08ÏĞ *cascade08Ğ×*cascade08×Ú *cascade08ÚÛ *cascade08Ûã*cascade08ãä*cascade08äğ*cascade08ğñ *cascade08ñó*cascade08óô *cascade08ôƒ*cascade08ƒ„ *cascade08„…*cascade08…† *cascade08†‡*cascade08‡‰ *cascade08‰–*cascade08–˜ *cascade08˜¤*cascade08¤¥ *cascade08¥«*cascade08«¬ *cascade08¬³*cascade08³´ *cascade08´ó*cascade08óü *cascade08ü… *cascade08…‘*cascade08‘Ç *cascade08ÇÓ*cascade08Óç *cascade08çó*cascade08ó‰ *cascade08‰•*cascade08• *cascade08ª*cascade08ªÇ *cascade08ÇÈ*cascade08ÈÉ *cascade08ÉÕ*cascade08Õè *cascade08
èé éõ*cascade08
õı ı‘ *cascade08
‘    ¿ *cascade08
¿ À  À È *cascade08È Ê  *cascade08Ê Ô *cascade08Ô ¤" *cascade08¤"²"*cascade08²"Ş$ *cascade08Ş$á$*cascade08á$â$ *cascade08â$ã$*cascade08ã$ä$ *cascade08ä$æ$*cascade08æ$è$ *cascade08è$é$*cascade08é$ê$ *cascade08ê$ë$*cascade08ë$ì$ *cascade08ì$î$*cascade08î$ï$ *cascade08ï$ñ$*cascade08ñ$ò$ *cascade08
ò$ó$ ó$ö$*cascade08
ö$÷$ ÷$ü$*cascade08ü$ş$ *cascade08
ş$€% €%%*cascade08
%‚% ‚%ƒ% *cascade08
ƒ%†% †%‡% *cascade08‡%‰%*cascade08
‰%% %% *cascade08%‘%*cascade08
‘%’% ’%“%*cascade08“%”% *cascade08
”%š% š%›% *cascade08›%œ%œ%% *cascade08
%¥% ¥%î) *cascade08î)ï)*cascade08ï)²* *cascade08²*å**cascade08å*©, *cascade08©,ß0*cascade08ß0«1 *cascade08«1ú1ú1Ÿ2 *cascade08Ÿ2Å2*cascade08Å2Æ2 *cascade08Æ2Û2*cascade08Û2Ü2 *cascade08Ü2î2*cascade08î2ï2 *cascade08ï2ñ2*cascade08ñ2ò2 *cascade08ò2—3*cascade08—3™3 *cascade08™3 3*cascade08 3¡3 *cascade08¡3¤3*cascade08¤3¥3 *cascade08¥3¬3*cascade08¬3Ñ3 *cascade08Ñ3ô3ô34 *cascade084—4*cascade08—4™4 *cascade08™4º4*cascade08º4Ø4 *cascade08Ø4ş4*cascade08ş4…5 *cascade08…5­5*cascade08­5µ5 *cascade08µ5İ5*cascade08İ56 *cascade086©6*cascade08©6Ö6 *cascade08Ö6å6å6ş6 *cascade08
ş67 7š7 *cascade08š7›7*cascade08›77 *cascade087«7«7¬7 *cascade08¬7­7*cascade08­7®7 *cascade08®7¸7¸7¼7 *cascade08¼7½7 *cascade08½7ÿ7 *cascade08ÿ7«8*cascade08«8±8 *cascade08±8Å8*cascade08Å8Î9 *cascade08Î9õ9 *cascade08õ9ö9 *cascade08ö9ü9*cascade08ü9’: *cascade08’:»:*cascade08»:¼: *cascade08¼: ;*cascade08 ;£; *cascade08£;Å;*cascade08Å;Ç; *cascade08Ç;ä;*cascade08ä;—? *cascade08—?’@*cascade08’@ûB *cascade08ûB“C*cascade08“C¹D *cascade08¹DçD*cascade08çD¸E *cascade08¸EĞE*cascade08ĞEÜE *cascade08ÜEÜE*cascade08ÜEôE *cascade08ôEƒG*cascade08ƒG”H *cascade08”H¤H*cascade08¤H°I *cascade08°IÌI*cascade08ÌIÎI *cascade08ÎIğI*cascade08ğIûI *cascade08ûIıI*cascade08ıIÙJ *cascade08ÙJéJ*cascade08éJK *cascade08K¤K*cascade08¤K¥K *cascade08¥K¦K*cascade08¦KÍK *cascade08ÍKéK*cascade08éKêK *cascade08êKØL*cascade08ØLÙL *cascade08ÙLúL*cascade08úLM *cascade08MƒM*cascade08ƒMN *cascade08NN*cascade08N¸N *cascade08¸N¹N*cascade08¹NºN *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¨file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/product/%5Bid%5D/page.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version