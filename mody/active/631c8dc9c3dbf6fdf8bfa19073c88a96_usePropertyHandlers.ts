Ω)"use client";

/**
 * Property Handlers - Selection, creation, and publishing
 * Store CRUD actions moved to useStoreActions.ts
 * ~85 lines
 */

import { toast } from "sonner";
import { Property, PropertyType, MockTemplate, Language, mockTemplates } from "./types";
import { createStoreActions, StoreActionsConfig } from "./useStoreActions";

export interface PropertyHandlersConfig extends StoreActionsConfig {
    selectedProperty: Property | null;
    setSelectedProperty: React.Dispatch<React.SetStateAction<Property | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    setSelectedTemplate: React.Dispatch<React.SetStateAction<MockTemplate | null>>;
    setViewMode: React.Dispatch<React.SetStateAction<string>>;
    setCreatePropertyOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function createPropertyHandlers(config: PropertyHandlersConfig) {
    const { properties, setProperties, selectedProperty, setSelectedProperty, setIsLoading, setMobileMenuOpen, setActiveTab, setSelectedTemplate, setViewMode, setCreatePropertyOpen, language } = config;

    // Import store CRUD actions
    const storeActions = createStoreActions(config);

    const handleSelectProperty = (property: Property | null) => {
        if (property && property.id !== selectedProperty?.id) {
            setIsLoading(true);
            setMobileMenuOpen(false);
            setTimeout(() => {
                setSelectedProperty(property);
                setActiveTab("overview");
                setIsLoading(false);
                toast.success(`${property.emoji} Switched to ${language === "ar" ? property.nameAr : property.name}`, { duration: 2000 });
            }, 300);
        } else if (!property) {
            setSelectedProperty(null);
            setMobileMenuOpen(false);
        }
    };

    const handleCreateProperty = async (name: string, type: PropertyType, template: MockTemplate) => {
        const subdomain = name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20);
        try {
            const res = await fetch("/api/stores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, subdomain, type }),
            });
            const json = await res.json();
            if (json.success && json.data) {
                const newProp: Property = {
                    id: json.data.id, name, nameAr: name, type, emoji: template.preview,
                    url: `${subdomain}.egybag.com`, isLive: false, templateId: template.id,
                };
                setProperties(prev => [newProp, ...prev]);
                setSelectedProperty(newProp);
                setSelectedTemplate(template);
                setCreatePropertyOpen(false);
                window.location.href = `/newlayout1/preview/builder?storeId=${json.data.id}`;
            } else { toast.error("Failed to create store"); }
        } catch { toast.error("Failed to create store"); }
    };

    const handlePublish = () => {
        if (selectedProperty) {
            setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, isLive: true } : p));
            setSelectedProperty({ ...selectedProperty, isLive: true });
            toast.success(`üöÄ ${language === "ar" ? "ÿ™ŸÖ ŸÜÿ¥ÿ±" : "Published"} ${selectedProperty.name}!`);
            setViewMode("dashboard");
        }
    };

    const handleSelectTemplateFromGallery = async (template: MockTemplate) => {
        const name = language === "ar" ? "ŸÖÿ¥ÿ±Ÿàÿπ ÿ¨ÿØŸäÿØ" : "New Project";
        const subdomain = `store-${Date.now()}`;
        try {
            const res = await fetch("/api/stores", {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "include", body: JSON.stringify({ name, subdomain, category: template.type }),
            });
            const json = await res.json();
            if (json.success && json.store) {
                toast.success(language === "ar" ? "ÿ™ŸÖ ÿ•ŸÜÿ¥ÿßÿ° ÿßŸÑŸÖÿ™ÿ¨ÿ±!" : "Store created!");
                setSelectedTemplate(template);
                setViewMode("builder");
            } else { toast.error(json.error || "Failed to create store"); }
        } catch { toast.error("Failed to create store"); }
    };

    const handleAIGenerate = (name: string) => {
        const template = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
        const newProp: Property = {
            id: Date.now().toString(), name, nameAr: name, type: template.type,
            emoji: "ü§ñ", url: `${name.toLowerCase().replace(/\s/g, "-")}.egybag.com`,
            isLive: false, templateId: template.id,
        };
        setProperties([newProp, ...properties]);
        setSelectedProperty(newProp);
        setSelectedTemplate(template);
        setViewMode("builder");
        toast.success(`ü§ñ ${language === "ar" ? "ÿ™ŸÖ ÿ•ŸÜÿ¥ÿßÿ° ÿ®ÿßŸÑÿ∞ŸÉÿßÿ° ÿßŸÑÿßÿµÿ∑ŸÜÿßÿπŸä!" : "AI Generated!"}`);
    };

    return { handleSelectProperty, handleCreateProperty, handlePublish, handleSelectTemplateFromGallery, handleAIGenerate, ...storeActions };
}
* *cascade08*/*cascade08/0 *cascade0806*cascade0867 *cascade0878*cascade088: *cascade08:A*cascade08AC *cascade08CD*cascade08DE *cascade08EH*cascade08HI *cascade08IQ*cascade08QS *cascade08SU*cascade08UW *cascade08W[*cascade08[] *cascade08]a*cascade08ad *cascade08de*cascade08ef *cascade08fg*cascade08gh *cascade08hj*cascade08jk *cascade08kl*cascade08lm *cascade08mn*cascade08np *cascade08pq*cascade08qu *cascade08uw*cascade08w{ *cascade08{Ä*cascade08ÄÅ *cascade08Åá*cascade08áä *cascade08äå*cascade08åã *cascade08ãç*cascade08çí *cascade08íò*cascade08òö *cascade08öù*cascade08ùü *cascade08üß*cascade08ß® *cascade08®™*cascade08™´ *cascade08´¨*cascade08¨≠ *cascade08≠Ø*cascade08Ø∞ *cascade08∞≤*cascade08≤ª *cascade08ªº*cascade08ºΩ *cascade08Ωæ*cascade08æ¿ *cascade08¿«*cascade08«» *cascade08»À*cascade08ÀÃ *cascade08Ãœ*cascade08œ“ *cascade08“’*cascade08’◊ *cascade08◊ÿ*cascade08ÿŸ *cascade08Ÿ⁄*cascade08⁄€ *cascade08€‹*cascade08‹‡ *cascade08‡·*cascade08·„ *cascade08„Â*cascade08ÂË *cascade08ËÈ*cascade08ÈÒ *cascade08ÒÚ*cascade08ÚÛ *cascade08ÛÙ*cascade08Ùı *cascade08ıˆ*cascade08ˆ˘ *cascade08˘˙*cascade08˙˚ *cascade08˚ˇ*cascade08ˇÅ *cascade08ÅÇ*cascade08ÇÑ *cascade08ÑÖ*cascade08Öä *cascade08äå*cascade08åì *cascade08ìï*cascade08ïñ *cascade08ñú*cascade08úÕ	 *cascade08Õ	§
*cascade08§
®) *cascade08®)´)*cascade08´)∞) *cascade08∞)≤)*cascade08≤)∂) *cascade08∂)∑)*cascade08∑)Ω) *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72ùfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/usePropertyHandlers.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version