/**
 * Features Settings - Edit feature items
 * ~55 lines - AI friendly
 */

import { Field } from "./FieldComponents";

interface FeatureItem { icon: string; title: string; description: string; }

interface FeaturesSettingsProps {
    settings: Record<string, string | number | boolean>;
    onUpdate: (key: string, value: string | number | boolean) => void;
}

export function FeaturesSettings({ settings, onUpdate }: FeaturesSettingsProps) {
    const rawFeatures = settings.features;
    const features: FeatureItem[] = rawFeatures ? (typeof rawFeatures === "string" ? JSON.parse(rawFeatures) : []) : [];

    const updateFeature = (index: number, field: keyof FeatureItem, value: string) => {
        const updated = [...features];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate("features", JSON.stringify(updated));
    };

    const addFeature = () => {
        const updated = [...features, { icon: "â­", title: "New Feature", description: "Feature description" }];
        onUpdate("features", JSON.stringify(updated));
    };

    const removeFeature = (index: number) => {
        const updated = features.filter((_, i) => i !== index);
        onUpdate("features", JSON.stringify(updated));
    };

    return (
        <div className="space-y-4">
            <Field label="Section Title" value={String(settings.title || "WHY CHOOSE US")} onChange={(v: string) => onUpdate("title", v)} />

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500 uppercase">Features ({features.length}/6)</label>
                    {features.length < 6 && <button onClick={addFeature} className="text-xs text-red-500 font-medium hover:text-red-600">+ Add</button>}
                </div>

                {features.map((f, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Feature {idx + 1}</span>
                            <button onClick={() => removeFeature(idx)} className="text-red-400 hover:text-red-600">âœ•</button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <input value={f.icon} onChange={e => updateFeature(idx, "icon", e.target.value)} className="px-2 py-1 border rounded text-center text-lg" placeholder="ğŸšš" maxLength={2} />
                            <input value={f.title} onChange={e => updateFeature(idx, "title", e.target.value)} className="col-span-2 px-2 py-1 border rounded text-sm" placeholder="Feature Title" />
                        </div>
                        <input value={f.description} onChange={e => updateFeature(idx, "description", e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="Description" />
                    </div>
                ))}
            </div>
        </div>
    );
}
W *cascade08WW*cascade08W÷ *cascade08÷ø*cascade08øù *cascade08ùÿ*cascade08ÿ€ *cascade08€‡*cascade08‡ˆ *cascade08ˆ‰*cascade08‰Œ *cascade08Œ“*cascade08“” *cascade08”š*cascade08š› *cascade08› *cascade08 È *cascade08Èó*cascade08ó *cascade08‘*cascade08‘£ *cascade08£§*cascade08§É *cascade08ÉÍ*cascade08Íõ
 *cascade08õ
ö
*cascade08ö
÷
 *cascade08÷
€*cascade08€ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72´file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/settings/FeaturesSettings.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version