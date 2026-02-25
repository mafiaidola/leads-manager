Ù/**
 * Hero Section Settings
 * Full control over hero banner with image upload
 * Per /section-completeness workflow
 */

import { FieldGroup, Field, SelectField, ColorPicker } from "./FieldComponents";

interface HeroSettingsProps {
    settings: Record<string, string | number | boolean>;
    onUpdate: (key: string, value: string | number | boolean) => void;
    onImageUpload?: () => void;
}

const BUTTON_ACTIONS = [
    { value: "checkout", label: "Go to Checkout" },
    { value: "add-to-cart", label: "Add to Cart" },
    { value: "custom-link", label: "Custom Link" },
];

export function HeroSettings({ settings, onUpdate, onImageUpload }: HeroSettingsProps) {
    return (
        <>
            {/* Content */}
            <FieldGroup title="Content">
                <Field label="Title" value={settings.title as string} onChange={(v) => onUpdate("title", v)} />
                <ColorPicker label="Title Color" value={(settings.titleColor as string) || "#ffffff"} onChange={(v) => onUpdate("titleColor", v)} />
                <Field label="Subtitle" value={settings.subtitle as string} onChange={(v) => onUpdate("subtitle", v)} />
                <ColorPicker label="Subtitle Color" value={(settings.subtitleColor as string) || "#9ca3af"} onChange={(v) => onUpdate("subtitleColor", v)} />
                <Field label="Price" value={settings.price as string} onChange={(v) => onUpdate("price", v)} type="number" />
                <Field label="Original Price" value={settings.originalPrice as string} onChange={(v) => onUpdate("originalPrice", v)} type="number" />
            </FieldGroup>

            {/* Hero Image - FIXED: using imageUrl */}
            <FieldGroup title="Hero Image">
                <Field label="Image URL" value={(settings.imageUrl as string) || ""} onChange={(v) => onUpdate("imageUrl", v)} placeholder="/template-products/sneaker-5.png" />
                {onImageUpload && (
                    <button onClick={onImageUpload} className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        üì∑ Choose from Library
                    </button>
                )}
            </FieldGroup>

            {/* Primary Button */}
            <FieldGroup title="Primary Button">
                <Field label="Text" value={(settings.buttonText as string) || "BUY NOW"} onChange={(v) => onUpdate("buttonText", v)} />
                <SelectField
                    label="Action"
                    value={(settings.buttonAction as string) || "checkout"}
                    options={BUTTON_ACTIONS}
                    onChange={(v) => onUpdate("buttonAction", v)}
                />
                {(settings.buttonAction === "custom-link") && (
                    <Field label="Link URL" value={(settings.buttonLink as string) || ""} onChange={(v) => onUpdate("buttonLink", v)} placeholder="https://..." />
                )}
                <ColorPicker label="Color" value={(settings.buttonColor as string) || "#E53935"} onChange={(v) => onUpdate("buttonColor", v)} />
            </FieldGroup>

            {/* Secondary Button */}
            <FieldGroup title="Secondary Button">
                <Field label="Text" value={(settings.secondaryButtonText as string) || "ADD TO CART"} onChange={(v) => onUpdate("secondaryButtonText", v)} />
                <SelectField
                    label="Action"
                    value={(settings.secondaryButtonAction as string) || "add-to-cart"}
                    options={BUTTON_ACTIONS}
                    onChange={(v) => onUpdate("secondaryButtonAction", v)}
                />
                <ColorPicker label="Border Color" value={(settings.secondaryButtonBorderColor as string) || "#9ca3af"} onChange={(v) => onUpdate("secondaryButtonBorderColor", v)} />
            </FieldGroup>
        </>
    );
}
˛ *cascade08˛ììÒ *cascade08Òè
è
Ù *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72∞file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/settings/HeroSettings.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version