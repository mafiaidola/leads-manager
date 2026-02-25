¢"use client";

/**
 * SEO-Optimized AI Suggestions for inline editing
 * Extracted from EditableElement for line limit compliance
 * ~50 lines
 */

export interface SEOSuggestion {
    text: string;
    seoTip: string;
}

// SEO-OPTIMIZED SUGGESTIONS - Keywords that rank, convert, and dominate
export const SEO_SUGGESTIONS: Record<string, SEOSuggestion[]> = {
    heading: [
        { text: "Premium Collection 2024 | Free Shipping", seoTip: "Year + benefit keyword" },
        { text: "Shop Best Sellers - Limited Stock Available", seoTip: "Action + urgency" },
        { text: "Exclusive Deals: Up to 50% Off Today Only", seoTip: "Discount + time pressure" },
        { text: "New Arrivals | Trending Now | Shop Online", seoTip: "Multiple keywords" },
    ],
    text: [
        { text: "Discover our handcrafted collection with free worldwide shipping on orders over $50.", seoTip: "Benefit + threshold" },
        { text: "Trusted by 10,000+ customers. 5-star rated. 30-day money back guarantee.", seoTip: "Social proof + trust" },
        { text: "Premium quality materials. Ethically sourced. Fast 2-day delivery available.", seoTip: "USP + delivery promise" },
        { text: "Join 50,000+ happy customers who saved up to 40% on their first order.", seoTip: "Numbers + savings" },
    ],
    button: [
        { text: "Shop Now - Free Shipping", seoTip: "Action + incentive" },
        { text: "Get 20% Off Today", seoTip: "Discount + urgency" },
        { text: "Add to Cart - Only 3 Left!", seoTip: "Scarcity trigger" },
        { text: "Claim Your Discount â†’", seoTip: "Ownership language" },
    ],
    navigation: [
        { text: "LUXE KICKS | Premium Sneakers", seoTip: "Brand + category" },
        { text: "Shop Authentic Sneakers Online", seoTip: "Trust + channel" },
        { text: "Free Shipping on All Orders", seoTip: "Value proposition" },
    ],
    footer: [
        { text: "Premium footwear for the modern lifestyle.", seoTip: "Brand positioning" },
        { text: "Trusted by sneaker enthusiasts worldwide.", seoTip: "Social proof" },
        { text: "Shop authentic. Free returns. Fast delivery.", seoTip: "Trust signals" },
    ],
    features: [
        { text: "WHY CHOOSE US | FREE SHIPPING", seoTip: "Benefit keyword" },
        { text: "Customer Benefits & Guarantees", seoTip: "Trust + clarity" },
        { text: "Premium Quality | Fast Delivery | Easy Returns", seoTip: "Multi-benefit" },
    ],
    products: [
        { text: "FEATURED PRODUCTS | Best Sellers", seoTip: "Category + popularity" },
        { text: "Shop Our Most Popular Items", seoTip: "Social proof" },
        { text: "Trending Now | Limited Stock", seoTip: "Urgency + popularity" },
    ],
};

export function getSEOSuggestions(elementType: string): SEOSuggestion[] {
    return SEO_SUGGESTIONS[elementType] || SEO_SUGGESTIONS.text;
}
¢*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72 file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/seoSuggestions.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version