„"use client";

/**
 * Template About Section - Story-focused, no pricing
 * Phase C: Added EditableElement for inline editing
 * ~75 lines - AI friendly
 */

import { EditableElement } from "./EditableElement";

interface TemplateAboutProps {
    title?: string;
    subtitle?: string;
    story?: string;
    image?: string;
    onTitleChange?: (value: string) => void;
    onSubtitleChange?: (value: string) => void;
    onStoryChange?: (value: string) => void;
}

export function TemplateAbout({
    title = "OUR STORY",
    subtitle = "Crafting excellence since 2020",
    story = "We started with a simple mission: bring premium quality footwear to everyone. Today, we're proud to serve customers worldwide with the finest sneakers.",
    image = "/template-products/sneaker-1.png",
    onTitleChange,
    onSubtitleChange,
    onStoryChange,
}: TemplateAboutProps) {
    return (
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div>
                        <EditableElement elementId="about-title" elementType="heading" value={title} onValueChange={onTitleChange}>
                            <h1 className="text-4xl md:text-5xl font-black italic text-red-500 mb-4">
                                {title}
                            </h1>
                        </EditableElement>

                        <EditableElement elementId="about-subtitle" elementType="text" value={subtitle} onValueChange={onSubtitleChange}>
                            <p className="text-xl text-gray-300 mb-6">{subtitle}</p>
                        </EditableElement>

                        <EditableElement elementId="about-story" elementType="text" value={story} onValueChange={onStoryChange}>
                            <p className="text-gray-400 leading-relaxed mb-8">{story}</p>
                        </EditableElement>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-500">500K+</p>
                                <p className="text-sm text-gray-400">Happy Customers</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-500">50+</p>
                                <p className="text-sm text-gray-400">Countries</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-500">4.9â˜…</p>
                                <p className="text-sm text-gray-400">Rating</p>
                            </div>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="relative">
                        <EditableElement elementId="about-image" elementType="image">
                            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl p-8 border border-gray-600">
                                <img src={image} alt="About" className="w-full max-w-md mx-auto" />
                            </div>
                        </EditableElement>
                    </div>
                </div>
            </div>
        </section>
    );
}
„"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72 file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/TemplateAbout.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version