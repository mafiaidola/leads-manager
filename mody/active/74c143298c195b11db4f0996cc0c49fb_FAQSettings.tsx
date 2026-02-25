ý"use client";

/**
 * FAQ Settings Panel - Dynamic array CRUD
 * ~70 lines - AI friendly
 */

import { FieldGroup, Field } from "./index";
import { ArrayEditor, ArrayItem } from "./ArrayEditor";

interface FAQSettingsProps {
    settings: Record<string, string | number | boolean>;
    onUpdate: (key: string, value: string | number | boolean) => void;
}

const defaultFAQs: ArrayItem[] = [
    { id: "faq-1", question: "What is your return policy?", answer: "We offer a 30-day return policy on all unworn items." },
    { id: "faq-2", question: "How long does shipping take?", answer: "Standard shipping takes 3-5 business days." },
    { id: "faq-3", question: "Do you ship internationally?", answer: "Yes! We ship to over 50 countries worldwide." },
    { id: "faq-4", question: "How can I track my order?", answer: "You'll receive a tracking number via email once shipped." },
];

export function FAQSettings({ settings, onUpdate }: FAQSettingsProps) {
    const rawFaqs = settings.faqs;
    const faqs: ArrayItem[] = rawFaqs
        ? (typeof rawFaqs === "string" ? JSON.parse(rawFaqs) : [])
        : defaultFAQs;

    const handleUpdate = (newFaqs: ArrayItem[]) => {
        onUpdate("faqs", JSON.stringify(newFaqs));
    };

    return (
        <>
            <FieldGroup title="Content">
                <Field
                    label="Title"
                    value={(settings.title as string) || "Frequently Asked Questions"}
                    onChange={(v) => onUpdate("title", v)}
                />
                <Field
                    label="Subtitle"
                    value={(settings.subtitle as string) || "Got questions? We've got answers"}
                    onChange={(v) => onUpdate("subtitle", v)}
                />
            </FieldGroup>

            <FieldGroup title="FAQ Items">
                <ArrayEditor
                    items={faqs}
                    fields={[
                        { key: "question", label: "Question", type: "text", placeholder: "e.g., What is your return policy?" },
                        { key: "answer", label: "Answer", type: "textarea", placeholder: "Provide a helpful answer..." },
                    ]}
                    onUpdate={handleUpdate}
                    addLabel="+ Add FAQ"
                    emptyMessage="No FAQ items yet"
                    maxItems={10}
                />
            </FieldGroup>
        </>
    );
}
ý*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¯file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/settings/FAQSettings.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version