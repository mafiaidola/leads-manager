‚"use client";

/**
 * Gallery Settings Panel - Dynamic image array CRUD
 * ~75 lines - AI friendly
 */

import { FieldGroup, Field, SelectField } from "./index";
import { ArrayEditor, ArrayItem } from "./ArrayEditor";

interface GallerySettingsProps {
    settings: Record<string, string | number | boolean>;
    onUpdate: (key: string, value: string | number | boolean) => void;
}

const defaultImages: ArrayItem[] = [
    { id: "img-1", url: "/template-products/sneaker-1.png", alt: "Product 1" },
    { id: "img-2", url: "/template-products/sneaker-2.png", alt: "Product 2" },
    { id: "img-3", url: "/template-products/sneaker-3.png", alt: "Product 3" },
    { id: "img-4", url: "/template-products/sneaker-4.png", alt: "Product 4" },
    { id: "img-5", url: "/template-products/sneaker-5.png", alt: "Product 5" },
    { id: "img-6", url: "/template-products/sneaker-6.png", alt: "Product 6" },
];

export function GallerySettings({ settings, onUpdate }: GallerySettingsProps) {
    const rawImages = settings.images;
    const images: ArrayItem[] = rawImages
        ? (typeof rawImages === "string" ? JSON.parse(rawImages) : [])
        : defaultImages;

    const handleUpdate = (newImages: ArrayItem[]) => {
        onUpdate("images", JSON.stringify(newImages));
    };

    return (
        <>
            <FieldGroup title="Content">
                <Field
                    label="Title"
                    value={(settings.title as string) || "Gallery"}
                    onChange={(v) => onUpdate("title", v)}
                />
            </FieldGroup>

            <FieldGroup title="Layout">
                <SelectField
                    label="Columns"
                    value={String(settings.columns || 3)}
                    options={[
                        { value: "2", label: "2 Columns" },
                        { value: "3", label: "3 Columns" },
                        { value: "4", label: "4 Columns" },
                    ]}
                    onChange={(v) => onUpdate("columns", Number(v))}
                />
            </FieldGroup>

            <FieldGroup title="Images">
                <ArrayEditor
                    items={images}
                    fields={[
                        { key: "url", label: "Image URL", type: "text", placeholder: "https://..." },
                        { key: "alt", label: "Alt Text", type: "text", placeholder: "Describe the image" },
                    ]}
                    onUpdate={handleUpdate}
                    addLabel="+ Add Image"
                    emptyMessage="No images yet"
                    maxItems={20}
                />
            </FieldGroup>
        </>
    );
}
‚*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72³file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/settings/GallerySettings.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version