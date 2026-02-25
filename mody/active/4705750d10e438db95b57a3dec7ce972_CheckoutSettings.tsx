— /**
 * Checkout Settings - Configure checkout appearance and options
 * Allows customization of fields, payment display, and styling
 * ~70 lines - AI friendly
 */

import { Field, FieldGroup, ToggleField, SelectField } from "./FieldComponents";

interface CheckoutSettingsProps {
    settings: Record<string, string | number | boolean>;
    onUpdate: (key: string, value: string | number | boolean) => void;
}

export function CheckoutSettings({ settings, onUpdate }: CheckoutSettingsProps) {
    return (
        <div className="space-y-4">
            <FieldGroup title="Checkout Appearance">
                <Field
                    label="Checkout Title"
                    value={String(settings.checkoutTitle || "Checkout")}
                    onChange={(v: string) => onUpdate("checkoutTitle", v)}
                />
                <SelectField
                    label="Checkout Layout"
                    value={String(settings.checkoutLayout || "two-column")}
                    options={[
                        { value: "two-column", label: "Two Column (Form + Summary)" },
                        { value: "single", label: "Single Column" },
                        { value: "accordion", label: "Accordion Steps" },
                    ]}
                    onChange={(v: string) => onUpdate("checkoutLayout", v)}
                />
            </FieldGroup>

            <FieldGroup title="Form Fields">
                <ToggleField label="Require Phone Number" value={Boolean(settings.requirePhone ?? true)} onChange={(v: boolean) => onUpdate("requirePhone", v)} />
                <ToggleField label="Require Address Line 2" value={Boolean(settings.requireAddress2)} onChange={(v: boolean) => onUpdate("requireAddress2", v)} />
                <ToggleField label="Show Company Field" value={Boolean(settings.showCompany)} onChange={(v: boolean) => onUpdate("showCompany", v)} />
                <ToggleField label="Show Order Notes" value={Boolean(settings.showNotes ?? true)} onChange={(v: boolean) => onUpdate("showNotes", v)} />
            </FieldGroup>

            <FieldGroup title="Payment & Trust">
                <ToggleField label="Show Trust Badges" value={Boolean(settings.showTrustBadges ?? true)} onChange={(v: boolean) => onUpdate("showTrustBadges", v)} />
                <ToggleField label="Show Secure Checkout Icon" value={Boolean(settings.showSecureIcon ?? true)} onChange={(v: boolean) => onUpdate("showSecureIcon", v)} />
                <ToggleField label="Show Return Policy" value={Boolean(settings.showReturnPolicy ?? true)} onChange={(v: boolean) => onUpdate("showReturnPolicy", v)} />
                <Field
                    label="Return Policy Text"
                    value={String(settings.returnPolicyText || "30-day hassle-free returns")}
                    onChange={(v: string) => onUpdate("returnPolicyText", v)}
                />
            </FieldGroup>

            <FieldGroup title="Cart Drawer">
                <SelectField
                    label="Cart Style"
                    value={String(settings.cartStyle || "drawer")}
                    options={[
                        { value: "drawer", label: "Slide-out Drawer" },
                        { value: "modal", label: "Modal Popup" },
                        { value: "page", label: "Separate Page" },
                    ]}
                    onChange={(v: string) => onUpdate("cartStyle", v)}
                />
                <ToggleField label="Show Quick Add" value={Boolean(settings.showQuickAdd ?? true)} onChange={(v: boolean) => onUpdate("showQuickAdd", v)} />
                <ToggleField label="Show Free Shipping Bar" value={Boolean(settings.showShippingBar ?? true)} onChange={(v: boolean) => onUpdate("showShippingBar", v)} />
                <Field
                    label="Free Shipping Threshold"
                    value={String(settings.freeShippingAmount || "100")}
                    onChange={(v: string) => onUpdate("freeShippingAmount", v)}
                    type="number"
                />
            </FieldGroup>
        </div>
    );
}

Ï *cascade08ÏÓ*cascade08Óô *cascade08ôø*cascade08ø“ *cascade08“—*cascade08—¨ *cascade08¨¬*cascade08¬Ž *cascade08Ž’*cascade08’¼ *cascade08¼À*cascade08Àá *cascade08áå*cascade08å· *cascade08·»*cascade08»Ü *cascade08Üà*cascade08à•  *cascade08• – *cascade08– —  *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72´file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/settings/CheckoutSettings.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version