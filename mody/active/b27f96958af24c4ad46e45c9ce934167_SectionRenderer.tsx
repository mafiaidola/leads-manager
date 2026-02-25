¹2"use client";

/**
 * SectionRenderer - Maps section types to components
 * Extracted from BuilderCanvas for maintainability
 * ~75 lines
 */

import { SectionData } from "./useBuilderState";
import { TemplateNavigation } from "../TemplateNavigation";
import { TemplateHero } from "../TemplateHero";
import { TemplateProductGrid } from "../TemplateProductGrid";
import { TemplateFooter } from "../TemplateFooter";
import { TemplateAbout } from "../TemplateAbout";
import { TemplateContact } from "../TemplateContact";
import { TemplateFeatures } from "../TemplateFeatures";
import { TemplatePageHeader } from "../TemplatePageHeader";
import { TestimonialsSection, FAQSection, GallerySection, NewsletterSection, FooterSection, TeamSection } from "./sections";

interface SectionRendererProps {
    section: SectionData;
    sections: SectionData[];
    onUpdate: (key: string, value: string) => void;
    onImagePick?: () => void;
}

export function SectionRenderer({ section, sections, onUpdate, onImagePick }: SectionRendererProps) {
    const s = section.settings;
    const navSection = sections.find(sec => sec.type === "navigation");
    const navLogoUrl = navSection?.settings?.logoUrl as string | undefined;

    switch (section.type) {
        case "navigation":
            return <TemplateNavigation storeName={s.storeName as string} logoUrl={s.logoUrl as string} logoHeight={Number(s.logoHeight) || 32} onStoreNameChange={(v) => onUpdate("storeName", v)} />;

        case "hero":
            return (
                <TemplateHero
                    title={s.title as string} subtitle={s.subtitle as string}
                    price={Number(s.price) || 199} originalPrice={Number(s.originalPrice) || 249}
                    buttonText={(s.buttonText as string) || "BUY NOW"}
                    secondaryButtonText={(s.secondaryButtonText as string) || "ADD TO CART"}
                    buttonColor={(s.buttonColor as string) || "#E53935"}
                    imageUrl={(s.imageUrl as string) || "/template-products/sneaker-5.png"}
                    selectedColor={(s.selectedColor as string) || "#E53935"}
                    titleColor={(s.titleColor as string) || "#ffffff"}
                    subtitleColor={(s.subtitleColor as string) || "#9ca3af"}
                    titleBgColor={(s.titleBgColor as string) || "transparent"}
                    subtitleBgColor={(s.subtitleBgColor as string) || "transparent"}
                    onTitleChange={(v) => onUpdate("title", v)}
                    onSubtitleChange={(v) => onUpdate("subtitle", v)}
                    onTitleColorChange={(v) => onUpdate("titleColor", v)}
                    onSubtitleColorChange={(v) => onUpdate("subtitleColor", v)}
                    onTitleBgColorChange={(v) => onUpdate("titleBgColor", v)}
                    onSubtitleBgColorChange={(v) => onUpdate("subtitleBgColor", v)}
                    onButtonTextChange={(v) => onUpdate("buttonText", v)}
                    onSecondaryButtonTextChange={(v) => onUpdate("secondaryButtonText", v)}
                    onImageClick={onImagePick}
                    onColorSelect={(color) => onUpdate("selectedColor", color)}
                />
            );

        case "products":
            return <TemplateProductGrid title={(s.title as string) || "FEATURED PRODUCTS"} columns={Number(s.columns) || 3} count={Number(s.count) || 6} showTabs={s.showTabs !== false} onTitleChange={(v) => onUpdate("title", v)} />;

        case "footer":
            return <TemplateFooter storeName={s.storeName as string} tagline={s.tagline as string} logoUrl={navLogoUrl} footerLogoUrl={s.footerLogoUrl as string} useNavLogo={s.useNavLogo !== false} shopLinks={s.shopLinks ? JSON.parse(s.shopLinks as string) : undefined} supportLinks={s.supportLinks ? JSON.parse(s.supportLinks as string) : undefined} companyLinks={s.companyLinks ? JSON.parse(s.companyLinks as string) : undefined} facebookUrl={s.facebookUrl as string} instagramUrl={s.instagramUrl as string} twitterUrl={s.twitterUrl as string} youtubeUrl={s.youtubeUrl as string} privacyUrl={s.privacyUrl as string} termsUrl={s.termsUrl as string} copyright={s.copyright as string} onStoreNameChange={(v) => onUpdate("storeName", v)} onTaglineChange={(v) => onUpdate("tagline", v)} onCopyrightChange={(v) => onUpdate("copyright", v)} />;

        case "features":
            return <TemplateFeatures title={s.title as string} onTitleChange={(v) => onUpdate("title", v)} />;

        case "cta": case "contact":
            return <TemplateContact title={s.title as string} subtitle={s.subtitle as string} buttonText={(s.buttonText as string) || "SEND MESSAGE"} onTitleChange={(v) => onUpdate("title", v)} onSubtitleChange={(v) => onUpdate("subtitle", v)} onButtonTextChange={(v) => onUpdate("buttonText", v)} />;

        case "about":
            return <TemplateAbout title={s.title as string} subtitle={s.subtitle as string} story={s.story as string} onTitleChange={(v) => onUpdate("title", v)} onSubtitleChange={(v) => onUpdate("subtitle", v)} onStoryChange={(v) => onUpdate("story", v)} />;

        case "pageHeader": case "header":
            return <TemplatePageHeader title={s.title as string} subtitle={s.subtitle as string} onTitleChange={(v) => onUpdate("title", v)} onSubtitleChange={(v) => onUpdate("subtitle", v)} />;

        case "testimonials":
            return <TestimonialsSection settings={s} onTitleChange={(v) => onUpdate("title", v)} onSubtitleChange={(v) => onUpdate("subtitle", v)} />;

        case "faq":
            return <FAQSection settings={s} onTitleChange={(v) => onUpdate("title", v)} onSubtitleChange={(v) => onUpdate("subtitle", v)} />;

        case "gallery":
            return <GallerySection settings={s} onTitleChange={(v) => onUpdate("title", v)} />;

        case "newsletter":
            return <NewsletterSection settings={s} onTitleChange={(v) => onUpdate("title", v)} onSubtitleChange={(v) => onUpdate("subtitle", v)} />;

        case "customFooter":
            return <FooterSection settings={s} onStoreNameChange={(v) => onUpdate("storeName", v)} onTaglineChange={(v) => onUpdate("tagline", v)} />;

        case "team":
            return <TeamSection settings={s} onTitleChange={(v) => onUpdate("title", v)} onSubtitleChange={(v) => onUpdate("subtitle", v)} />;

        default:
            return <div className="p-8 bg-gray-100 text-center text-gray-500">Unknown: {section.type}</div>;
    }
}
† *cascade08†º*cascade08º¹! *cascade08¹!í!*cascade08í!È" *cascade08È"ô"*cascade08ô"¹2 *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72ªfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/SectionRenderer.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version