Ü"use client";

/**
 * Testimonials Section Renderer - Uses dynamic array data
 * INLINE EDITING: Title and subtitle editable on canvas
 * ~75 lines - AI friendly
 */

import { EditableElement } from "../../EditableElement";

interface Testimonial { id: string; name: string; role: string; quote: string; rating?: string; }

interface TestimonialsSectionProps {
    settings: Record<string, unknown>;
    onTitleChange?: (value: string) => void;
    onSubtitleChange?: (value: string) => void;
}

const defaultTestimonials: Testimonial[] = [
    { id: "1", name: "Sarah M.", role: "Verified Buyer", quote: "Amazing quality! Exactly what I was looking for.", rating: "5" },
    { id: "2", name: "James L.", role: "Sneaker Collector", quote: "Fast shipping and great product. Highly recommend!", rating: "5" },
    { id: "3", name: "Emma T.", role: "Fashion Enthusiast", quote: "Best store I've found. Will definitely buy again!", rating: "4" },
];

export function TestimonialsSection({ settings, onTitleChange, onSubtitleChange }: TestimonialsSectionProps) {
    const title = (settings.title as string) || "What Our Customers Say";
    const subtitle = (settings.subtitle as string) || "Join thousands of happy customers";
    const bgColor = (settings.backgroundColor as string) || "#F9FAFB";

    // Parse array data or use defaults
    const rawTestimonials = settings.testimonials as string | undefined;
    const testimonials: Testimonial[] = rawTestimonials ? JSON.parse(rawTestimonials) : defaultTestimonials;

    return (
        <div className="py-16 px-6" style={{ backgroundColor: bgColor }}>
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <EditableElement elementId="testimonials-title" elementType="heading" value={title} onValueChange={onTitleChange}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                    </EditableElement>
                    <EditableElement elementId="testimonials-subtitle" elementType="text" value={subtitle} onValueChange={onSubtitleChange}>
                        <p className="text-gray-600">{subtitle}</p>
                    </EditableElement>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {testimonials.map((t) => {
                        const rating = parseInt(t.rating || "5");
                        return (
                            <div key={t.id} className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm">
                                <div className="flex mb-3">
                                    {[...Array(5)].map((_, j) => (
                                        <span key={j} className={j < rating ? "text-yellow-400" : "text-gray-300"}>â˜…</span>
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-4 italic">&quot;{t.quote}&quot;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-500">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{t.name}</p>
                                        <p className="text-sm text-gray-500">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
Ü*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72·file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/sections/TestimonialsSection.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version