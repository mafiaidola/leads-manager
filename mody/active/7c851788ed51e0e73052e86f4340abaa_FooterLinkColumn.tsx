 "use client";

/**
 * FooterLinkColumn - Extracted from TemplateFooter
 * ~35 lines
 */

import Link from "next/link";

export interface FooterLink {
    label: string;
    url: string;
}

interface FooterLinkColumnProps {
    title: string;
    links: FooterLink[];
    isBuilderMode?: boolean;
    onLinkClick?: (url: string) => void;
}

export function FooterLinkColumn({ title, links, isBuilderMode, onLinkClick }: FooterLinkColumnProps) {
    return (
        <div>
            <h4 className="text-white font-bold uppercase mb-4">{title}</h4>
            <ul className="space-y-2">
                {links.map(link => (
                    <li key={link.label}>
                        {isBuilderMode ? (
                            <button onClick={() => onLinkClick?.(link.url)} className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer hover:underline text-left">
                                {link.label} â†’
                            </button>
                        ) : (
                            <Link href={link.url} className="text-gray-400 hover:text-white text-sm transition-colors">
                                {link.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Default link sets
export const defaultShopLinks: FooterLink[] = [
    { label: "Men", url: "/men" },
    { label: "Women", url: "/women" },
    { label: "Kids", url: "/kids" },
    { label: "Sale", url: "/sale" },
];

export const defaultSupportLinks: FooterLink[] = [
    { label: "FAQ", url: "/faq" },
    { label: "Shipping", url: "/shipping" },
    { label: "Returns", url: "/returns" },
    { label: "Contact Us", url: "/contact" },
];

export const defaultCompanyLinks: FooterLink[] = [
    { label: "About", url: "/about" },
    { label: "Careers", url: "/careers" },
    { label: "Stores", url: "/stores" },
];
 *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72£file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/FooterLinkColumn.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version