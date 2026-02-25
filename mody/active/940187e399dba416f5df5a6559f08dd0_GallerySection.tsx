—"use client";

/**
 * Gallery Section Renderer - Uses dynamic image array
 * INLINE EDITING: Title editable on canvas
 * ~60 lines - AI friendly
 */

import { EditableElement } from "../../EditableElement";

interface GalleryImage { id: string; url: string; alt?: string; }

interface GallerySectionProps {
    settings: Record<string, unknown>;
    onTitleChange?: (value: string) => void;
}

const defaultImages: GalleryImage[] = [
    { id: "1", url: "https://images.unsplash.com/photo-1549298916-f52d724c0a20?w=400", alt: "Product 1" },
    { id: "2", url: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400", alt: "Product 2" },
    { id: "3", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", alt: "Product 3" },
    { id: "4", url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400", alt: "Product 4" },
    { id: "5", url: "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=400", alt: "Product 5" },
    { id: "6", url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400", alt: "Product 6" },
];

export function GallerySection({ settings, onTitleChange }: GallerySectionProps) {
    const title = (settings.title as string) || "Gallery";
    const columns = Number(settings.columns) || 3;

    // Parse array data or use defaults
    const rawImages = settings.images as string | undefined;
    const images: GalleryImage[] = rawImages ? JSON.parse(rawImages) : defaultImages;

    return (
        <div className="py-16 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                {title && (
                    <EditableElement elementId="gallery-title" elementType="heading" value={title} onValueChange={onTitleChange}>
                        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">{title}</h2>
                    </EditableElement>
                )}
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                    {images.map((img) => (
                        <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                            <img
                                src={img.url}
                                alt={img.alt || `Gallery image`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
—*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72²file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/sections/GallerySection.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version