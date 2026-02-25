ï"use client";

/**
 * Team Section Renderer - Uses dynamic array data
 * INLINE EDITING: Title and subtitle editable on canvas
 * ~65 lines - AI friendly
 */

import { EditableElement } from "../../EditableElement";

interface TeamMember { id: string; name: string; role: string; image?: string; }

interface TeamSectionProps {
    settings: Record<string, unknown>;
    onTitleChange?: (value: string) => void;
    onSubtitleChange?: (value: string) => void;
}

const defaultMembers: TeamMember[] = [
    { id: "1", name: "Alex Johnson", role: "Founder & CEO", image: "" },
    { id: "2", name: "Sarah Chen", role: "Head of Design", image: "" },
    { id: "3", name: "Mike Wilson", role: "Lead Developer", image: "" },
    { id: "4", name: "Emily Brown", role: "Marketing Director", image: "" },
];

export function TeamSection({ settings, onTitleChange, onSubtitleChange }: TeamSectionProps) {
    const title = (settings.title as string) || "Meet Our Team";
    const subtitle = (settings.subtitle as string) || "The passionate people behind our brand";

    // Parse array data or use defaults
    const rawMembers = settings.members as string | undefined;
    const members: TeamMember[] = rawMembers ? JSON.parse(rawMembers) : defaultMembers;

    return (
        <div className="py-16 px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <EditableElement elementId="team-title" elementType="heading" value={title} onValueChange={onTitleChange}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                    </EditableElement>
                    <EditableElement elementId="team-subtitle" elementType="text" value={subtitle} onValueChange={onSubtitleChange}>
                        <p className="text-gray-600">{subtitle}</p>
                    </EditableElement>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {members.map((member) => (
                        <div key={member.id} className="text-center">
                            {member.image ? (
                                <img src={member.image} alt={member.name} className="w-24 h-24 mx-auto mb-4 rounded-full object-cover" />
                            ) : (
                                <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                    {member.name.charAt(0)}
                                </div>
                            )}
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
ï*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¯file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/sections/TeamSection.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version