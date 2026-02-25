�>/**
 * Page Sections Data - Store pages with proper sections
 * Includes: Shop, Support, Legal, Company pages
 * ~110 lines - AI friendly
 */

import { SectionData } from "./useBuilderState";

// Shared components
const sharedNav: SectionData = { id: "nav", type: "navigation", name: "Navigation", settings: { storeName: "LUXE KICKS" } };
const sharedFooter: SectionData = { id: "footer", type: "footer", name: "Footer", settings: { storeName: "LUXE KICKS", copyright: "© 2024 All rights reserved" } };

export const defaultPageSections: Record<string, SectionData[]> = {
    // Home
    home: [
        sharedNav,
        { id: "hero", type: "hero", name: "Hero Banner", settings: { title: "PREMIUM COLLECTION 2024", subtitle: "Discover the Future of Footwear", price: "199", ctaText: "BUY NOW" } },
        { id: "products", type: "products", name: "Featured Products", settings: { title: "FEATURED PRODUCTS" } },
        sharedFooter,
    ],
    // Shop categories
    men: [sharedNav, { id: "men-header", type: "pageHeader", name: "Men Header", settings: { title: "MEN'S COLLECTION", subtitle: "Premium footwear for men" } }, { id: "men-products", type: "products", name: "Men Products", settings: { title: "MEN'S PRODUCTS" } }, sharedFooter],
    women: [sharedNav, { id: "women-header", type: "pageHeader", name: "Women Header", settings: { title: "WOMEN'S COLLECTION", subtitle: "Elegant styles for her" } }, { id: "women-products", type: "products", name: "Women Products", settings: { title: "WOMEN'S PRODUCTS" } }, sharedFooter],
    kids: [sharedNav, { id: "kids-header", type: "pageHeader", name: "Kids Header", settings: { title: "KIDS COLLECTION", subtitle: "Fun & durable for little ones" } }, { id: "kids-products", type: "products", name: "Kids Products", settings: { title: "KIDS PRODUCTS" } }, sharedFooter],
    sale: [sharedNav, { id: "sale-header", type: "pageHeader", name: "Sale Header", settings: { title: "SALE & DEALS", subtitle: "Up to 50% off selected items" } }, { id: "sale-products", type: "products", name: "Sale Products", settings: { title: "DISCOUNTED PRODUCTS" } }, sharedFooter],
    // Content pages
    about: [sharedNav, { id: "about-section", type: "about", name: "About Us", settings: { title: "OUR STORY", subtitle: "Crafting excellence since 2020" } }, { id: "about-features", type: "features", name: "Why Choose Us", settings: { title: "WHY LUXE KICKS" } }, sharedFooter],
    contact: [sharedNav, { id: "contact-section", type: "cta", name: "Contact Form", settings: { title: "GET IN TOUCH", subtitle: "We'd love to hear from you" } }, sharedFooter],
    // Support pages
    faq: [sharedNav, { id: "faq-header", type: "pageHeader", name: "FAQ Header", settings: { title: "FREQUENTLY ASKED QUESTIONS", subtitle: "Find answers to common questions" } }, { id: "faq-content", type: "faq", name: "FAQ", settings: { title: "FAQ" } }, sharedFooter],
    shipping: [sharedNav, { id: "shipping-header", type: "pageHeader", name: "Shipping Header", settings: { title: "SHIPPING INFORMATION", subtitle: "Fast and reliable delivery" } }, { id: "shipping-content", type: "about", name: "Shipping Policy", settings: { title: "SHIPPING POLICY", story: "We offer fast, reliable shipping worldwide. Standard delivery takes 5-7 business days. Express shipping available for 2-3 day delivery. All orders include tracking." } }, sharedFooter],
    returns: [sharedNav, { id: "returns-header", type: "pageHeader", name: "Returns Header", settings: { title: "RETURNS & REFUNDS", subtitle: "Easy 30-day return policy" } }, { id: "returns-content", type: "about", name: "Returns Policy", settings: { title: "RETURNS POLICY", story: "We want you to be completely satisfied. Returns accepted within 30 days of delivery. Items must be unworn with original tags. Refunds processed within 5-7 business days." } }, sharedFooter],
    // Legal pages
    privacy: [sharedNav, { id: "privacy-header", type: "pageHeader", name: "Privacy Header", settings: { title: "PRIVACY POLICY", subtitle: "Your privacy matters to us" } }, { id: "privacy-content", type: "about", name: "Privacy Details", settings: { title: "PRIVACY POLICY", story: "We collect personal information only when necessary. Your data is encrypted and never sold. You can request deletion at any time. See full policy below." } }, sharedFooter],
    terms: [sharedNav, { id: "terms-header", type: "pageHeader", name: "Terms Header", settings: { title: "TERMS OF SERVICE", subtitle: "Please read carefully" } }, { id: "terms-content", type: "about", name: "Terms Details", settings: { title: "TERMS OF SERVICE", story: "By using our website, you agree to these terms. All products are subject to availability. Prices may change without notice. Disputes handled per local law." } }, sharedFooter],
    // Company pages
    careers: [sharedNav, { id: "careers-header", type: "pageHeader", name: "Careers Header", settings: { title: "JOIN OUR TEAM", subtitle: "Build your future with us" } }, { id: "careers-content", type: "about", name: "Careers Info", settings: { title: "CAREERS AT LUXE KICKS", story: "We're always looking for passionate individuals to join our team. From retail to design, we offer exciting opportunities in the footwear industry. Check current openings below." } }, { id: "careers-cta", type: "cta", name: "Apply Now", settings: { title: "OPEN POSITIONS", ctaText: "VIEW OPENINGS" } }, sharedFooter],
    press: [sharedNav, { id: "press-header", type: "pageHeader", name: "Press Header", settings: { title: "PRESS & MEDIA", subtitle: "Latest news and coverage" } }, { id: "press-content", type: "about", name: "Press Info", settings: { title: "MEDIA CENTER", story: "For press inquiries, interview requests, or media kit downloads, please contact our communications team. Find our latest press releases and brand assets below." } }, sharedFooter],
    locations: [sharedNav, { id: "locations-header", type: "pageHeader", name: "Locations Header", settings: { title: "STORE LOCATIONS", subtitle: "Visit us in person" } }, { id: "locations-content", type: "about", name: "Store Finder", settings: { title: "FIND A STORE", story: "Visit one of our retail locations for a personalized shopping experience. Our expert staff can help you find the perfect fit. Try before you buy!" } }, { id: "locations-cta", type: "cta", name: "Store List", settings: { title: "OUR STORES", ctaText: "GET DIRECTIONS" } }, sharedFooter],
};

export type PageId = keyof typeof defaultPageSections;

export const pageList: { id: PageId; name: string; nameAr: string; category?: string }[] = [
    // Main pages
    { id: "home", name: "Home", nameAr: "الرئيسية", category: "main" },
    // Shop pages
    { id: "men", name: "Men", nameAr: "رجال", category: "shop" },
    { id: "women", name: "Women", nameAr: "نساء", category: "shop" },
    { id: "kids", name: "Kids", nameAr: "أطفال", category: "shop" },
    { id: "sale", name: "Sale", nameAr: "تخفيضات", category: "shop" },
    // Content pages
    { id: "about", name: "About", nameAr: "عن المتجر", category: "content" },
    { id: "contact", name: "Contact", nameAr: "اتصل بنا", category: "content" },
    // Support pages
    { id: "faq", name: "FAQ", nameAr: "الأسئلة الشائعة", category: "support" },
    { id: "shipping", name: "Shipping", nameAr: "الشحن", category: "support" },
    { id: "returns", name: "Returns", nameAr: "الإرجاع", category: "support" },
    // Legal pages
    { id: "privacy", name: "Privacy Policy", nameAr: "سياسة الخصوصية", category: "legal" },
    { id: "terms", name: "Terms of Service", nameAr: "شروط الخدمة", category: "legal" },
    // Company pages
    { id: "careers", name: "Careers", nameAr: "الوظائف", category: "content" },
    { id: "press", name: "Press", nameAr: "الإعلام", category: "content" },
    { id: "locations", name: "Store Locations", nameAr: "مواقع المتاجر", category: "content" },
];


^ *cascade08^g*cascade08gs *cascade08st*cascade08t�% *cascade08�%�2*cascade08�2�< *cascade08�<�>*cascade08�>�> *cascade08�>�>*cascade08�>�> *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/pageSectionsData.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version