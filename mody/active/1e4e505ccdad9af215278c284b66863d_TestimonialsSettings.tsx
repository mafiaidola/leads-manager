Æ"use client";

/**
 * Testimonials Settings Panel - Dynamic array CRUD
 * ~75 lines - AI friendly
 */

import { FieldGroup, Field, ColorPicker } from "./index";
import { ArrayEditor, ArrayItem } from "./ArrayEditor";

interface TestimonialsSettingsProps {
    settings: Record<string, string | number | boolean>;
    onUpdate: (key: string, value: string | number | boolean) => void;
}

const defaultTestimonials: ArrayItem[] = [
    { id: "t-1", name: "Sarah M.", role: "Verified Buyer", quote: "Amazing quality! Exactly what I was looking for.", rating: "5" },
    { id: "t-2", name: "James L.", role: "Sneaker Collector", quote: "Fast shipping and great product. Highly recommend!", rating: "5" },
    { id: "t-3", name: "Emma T.", role: "Fashion Enthusiast", quote: "Best store I've found. Will definitely buy again!", rating: "5" },
];

export function TestimonialsSettings({ settings, onUpdate }: TestimonialsSettingsProps) {
    const rawTestimonials = settings.testimonials;
    const testimonials: ArrayItem[] = rawTestimonials
        ? (typeof rawTestimonials === "string" ? JSON.parse(rawTestimonials) : [])
        : defaultTestimonials;

    const handleUpdate = (newTestimonials: ArrayItem[]) => {
        onUpdate("testimonials", JSON.stringify(newTestimonials));
    };

    return (
        <>
            <FieldGroup title="Content">
                <Field
                    label="Title"
                    value={(settings.title as string) || "What Our Customers Say"}
                    onChange={(v) => onUpdate("title", v)}
                />
                <Field
                    label="Subtitle"
                    value={(settings.subtitle as string) || "Join thousands of happy customers"}
                    onChange={(v) => onUpdate("subtitle", v)}
                />
            </FieldGroup>

            <FieldGroup title="Testimonials">
                <ArrayEditor
                    items={testimonials}
                    fields={[
                        { key: "name", label: "Customer Name", type: "text", placeholder: "e.g., Sarah M." },
                        { key: "role", label: "Role/Title", type: "text", placeholder: "e.g., Verified Buyer" },
                        { key: "quote", label: "Quote", type: "textarea", placeholder: "What did they say?" },
                    ]}
                    onUpdate={handleUpdate}
                    addLabel="+ Add Testimonial"
                    emptyMessage="No testimonials yet"
                    maxItems={8}
                />
            </FieldGroup>

            <FieldGroup title="Style">
                <ColorPicker
                    label="Background"
                    value={(settings.backgroundColor as string) || "#F9FAFB"}
                    onChange={(v) => onUpdate("backgroundColor", v)}
                />
            </FieldGroup>
        </>
    );
}
Æ*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¸file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/settings/TestimonialsSettings.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version