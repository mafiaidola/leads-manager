≥"use client";

/**
 * Section Settings - Routes to correct settings panel
 * Enhanced: Page navigation callbacks for footer
 * ~90 lines - AI friendly
 */

import { SectionType } from "./types";
import {
    HeroSettings,
    ProductsSettings,
    PageHeaderSettings,
    AboutSettings,
    ContactSettings,
    FooterSettings,
    NavigationSettings,
    TestimonialsSettings,
    FAQSettings,
    GallerySettings,
    NewsletterSettings,
    CustomFooterSettings,
    TeamSettings,
    FeaturesSettings,
} from "./settings";

interface SectionSettingsProps {
    sectionId: string;
    sectionType: SectionType;
    settings: Record<string, unknown>;
    onUpdate: (key: string, value: string | number | boolean) => void;
    language?: "en" | "ar";
    onLogoUpload?: () => void;
    onNavigateToPage?: (pageId: string) => void;
    onCreatePage?: (pageId: string) => void;
    existingPages?: string[];
}

export function SectionSettings({ sectionType, settings, onUpdate, onLogoUpload, onNavigateToPage, onCreatePage, existingPages }: SectionSettingsProps) {
    const s = settings as Record<string, string | number | boolean>;

    const renderFields = () => {
        switch (sectionType) {
            case "hero":
                return <HeroSettings settings={s} onUpdate={onUpdate} onImageUpload={onLogoUpload} />;
            case "products":
                return <ProductsSettings settings={s} onUpdate={onUpdate} />;
            case "pageHeader":
            case "header":
                return <PageHeaderSettings settings={s} onUpdate={onUpdate} />;
            case "about":
                return <AboutSettings settings={s} onUpdate={onUpdate} />;
            case "cta":
            case "contact":
                return <ContactSettings settings={s} onUpdate={onUpdate} />;
            case "footer":
                return <FooterSettings settings={s} onUpdate={onUpdate} onNavigateToPage={onNavigateToPage} onCreatePage={onCreatePage} existingPages={existingPages} />;
            case "customFooter":
                return <CustomFooterSettings settings={s} onUpdate={onUpdate} />;
            case "navigation":
                return <NavigationSettings settings={s} onUpdate={onUpdate} onLogoUpload={onLogoUpload} />;
            case "features":
                return <FeaturesSettings settings={s} onUpdate={onUpdate} />;
            case "testimonials":
                return <TestimonialsSettings settings={s} onUpdate={onUpdate} />;
            case "faq":
                return <FAQSettings settings={s} onUpdate={onUpdate} />;
            case "gallery":
                return <GallerySettings settings={s} onUpdate={onUpdate} />;
            case "newsletter":
                return <NewsletterSettings settings={s} onUpdate={onUpdate} />;
            case "team":
                return <TeamSettings settings={s} onUpdate={onUpdate} />;
            default:
                return <p className="text-gray-400 text-sm p-4">No settings available</p>;
        }
    };

    return (
        <div className="p-4 space-y-4">
            {renderFields()}
        </div>
    );
}

M *cascade08MO*cascade08OQ *cascade08QS*cascade08ST *cascade08TU*cascade08UW *cascade08WZ*cascade08Z[ *cascade08[b*cascade08bg *cascade08go*cascade08oq *cascade08qt*cascade08tu *cascade08ux*cascade08xz *cascade08z{*cascade08{Ä *cascade08ÄÇ*cascade08Ç‰ *cascade08‰˙*cascade08˙è *cascade08èã*cascade08ã› *cascade08›å*cascade08åÏ *cascade08Ï *cascade08 Å *cascade08ÅÇ*cascade08ÇÑ *cascade08ÑÜ*cascade08Üá *cascade08áâ*cascade08â± *cascade08±≤*cascade08≤≥ *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72™file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/SectionSettings.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version