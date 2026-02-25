°"use client";

/**
 * Team Settings Panel - Dynamic array CRUD
 * ~70 lines - AI friendly
 */

import { FieldGroup, Field } from "./index";
import { ArrayEditor, ArrayItem } from "./ArrayEditor";

interface TeamSettingsProps {
    settings: Record<string, string | number | boolean>;
    onUpdate: (key: string, value: string | number | boolean) => void;
}

const defaultMembers: ArrayItem[] = [
    { id: "m-1", name: "Alex Johnson", role: "Founder & CEO", image: "" },
    { id: "m-2", name: "Sarah Chen", role: "Head of Design", image: "" },
    { id: "m-3", name: "Mike Wilson", role: "Lead Developer", image: "" },
    { id: "m-4", name: "Emily Brown", role: "Marketing Director", image: "" },
];

export function TeamSettings({ settings, onUpdate }: TeamSettingsProps) {
    const rawMembers = settings.members;
    const members: ArrayItem[] = rawMembers
        ? (typeof rawMembers === "string" ? JSON.parse(rawMembers) : [])
        : defaultMembers;

    const handleUpdate = (newMembers: ArrayItem[]) => {
        onUpdate("members", JSON.stringify(newMembers));
    };

    return (
        <>
            <FieldGroup title="Content">
                <Field
                    label="Title"
                    value={(settings.title as string) || "Meet Our Team"}
                    onChange={(v) => onUpdate("title", v)}
                />
                <Field
                    label="Subtitle"
                    value={(settings.subtitle as string) || "The passionate people behind our brand"}
                    onChange={(v) => onUpdate("subtitle", v)}
                />
            </FieldGroup>

            <FieldGroup title="Team Members">
                <ArrayEditor
                    items={members}
                    fields={[
                        { key: "name", label: "Name", type: "text", placeholder: "e.g., John Smith" },
                        { key: "role", label: "Role", type: "text", placeholder: "e.g., CEO & Founder" },
                        { key: "image", label: "Photo URL", type: "text", placeholder: "https://..." },
                    ]}
                    onUpdate={handleUpdate}
                    addLabel="+ Add Team Member"
                    emptyMessage="No team members yet"
                    maxItems={12}
                />
            </FieldGroup>
        </>
    );
}
°*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72°file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/settings/TeamSettings.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version