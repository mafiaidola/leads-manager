§"use client";

/**
 * Template Features Section - Icon grid with EditableElement
 * Added inline editing for title
 * ~65 lines
 */

import { EditableElement } from "./EditableElement";

interface TemplateFeatureItem {
    icon: string;
    title: string;
    description: string;
}

interface TemplateFeaturesProps {
    title?: string;
    features?: TemplateFeatureItem[];
    onTitleChange?: (value: string) => void;
}

const defaultFeatures: TemplateFeatureItem[] = [
    { icon: "ğŸšš", title: "Free Shipping", description: "On all orders over $100" },
    { icon: "â†©ï¸", title: "Easy Returns", description: "30-day hassle-free returns" },
    { icon: "âœ“", title: "Authentic Products", description: "100% genuine guaranteed" },
    { icon: "ğŸ’¬", title: "24/7 Support", description: "Round the clock assistance" },
    { icon: "ğŸ”’", title: "Secure Payment", description: "Your data is protected" },
    { icon: "âš¡", title: "Fast Delivery", description: "2-5 business days" },
];

export function TemplateFeatures({
    title = "WHY CHOOSE US",
    features = defaultFeatures,
    onTitleChange,
}: TemplateFeaturesProps) {
    return (
        <section className="bg-gray-900 text-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <EditableElement elementId="features-title" elementType="heading" value={title} onValueChange={onTitleChange}>
                    <h2 className="text-3xl md:text-4xl font-black italic text-center text-red-500 mb-12">
                        {title}
                    </h2>
                </EditableElement>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-colors text-center"
                        >
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
< <?*cascade08?A AH*cascade08HI IP*cascade08PT TW*cascade08WX XY*cascade08YZ Z\*cascade08\] ]_*cascade08_` `d*cascade08de eh*cascade08hi ij*cascade08jo or*cascade08rw wy*cascade08y €*cascade08
€ ‹*cascade08
‹Œ Œ*cascade08
 *cascade08
‘ ‘•*cascade08
•– –—*cascade08
—˜ ˜*cascade08
 §*cascade08
§¨ ¨¹*cascade08
¹ø ø¥*cascade08
¥Â ÂÖ*cascade08
Ö
 
„*cascade08
„î îò*cascade08
òŠ Š*cascade08
’ ’µ*cascade08
µ§ "(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72£file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/TemplateFeatures.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version