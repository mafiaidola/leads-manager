Š"use client";

/**
 * FAQ Section Renderer - Uses dynamic array data
 * INLINE EDITING: Title and subtitle editable on canvas
 * ~70 lines - AI friendly
 */

import { useState } from "react";
import { EditableElement } from "../../EditableElement";

interface FAQItem { id: string; question: string; answer: string; }

interface FAQSectionProps {
    settings: Record<string, unknown>;
    onTitleChange?: (value: string) => void;
    onSubtitleChange?: (value: string) => void;
}

const defaultFAQs: FAQItem[] = [
    { id: "1", question: "What is your return policy?", answer: "We offer a 30-day return policy on all unworn items." },
    { id: "2", question: "How long does shipping take?", answer: "Standard shipping takes 3-5 business days." },
    { id: "3", question: "Do you ship internationally?", answer: "Yes! We ship to over 50 countries worldwide." },
    { id: "4", question: "How can I track my order?", answer: "You'll receive a tracking number via email once shipped." },
];

export function FAQSection({ settings, onTitleChange, onSubtitleChange }: FAQSectionProps) {
    const title = (settings.title as string) || "Frequently Asked Questions";
    const subtitle = (settings.subtitle as string) || "Got questions? We've got answers";

    // Parse array data or use defaults
    const rawFaqs = settings.faqs as string | undefined;
    const items: FAQItem[] = rawFaqs ? JSON.parse(rawFaqs) : defaultFAQs;

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="py-16 px-6 bg-white">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <EditableElement elementId="faq-title" elementType="heading" value={title} onValueChange={onTitleChange}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                    </EditableElement>
                    <EditableElement elementId="faq-subtitle" elementType="text" value={subtitle} onValueChange={onSubtitleChange}>
                        <p className="text-gray-600">{subtitle}</p>
                    </EditableElement>
                </div>
                <div className="space-y-3">
                    {items.map((item, i) => (
                        <div key={item.id || i} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full p-4 text-left flex items-center justify-between font-medium text-gray-900 hover:bg-gray-50"
                            >
                                <span>{item.question}</span>
                                <span className={`transition-transform ${openIndex === i ? "rotate-180" : ""}`}>â–¼</span>
                            </button>
                            {openIndex === i && (
                                <div className="p-4 pt-0 text-gray-600 border-t border-gray-100">{item.answer}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
Š*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72®file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/sections/FAQSection.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version