/**
 * @module lib/iconMap
 * @description Centralized icon mapping for lead sources and statuses.
 * Sources use Lucide React SVG icons. Statuses use emoji strings.
 */
import {
    Globe, Phone, Mail, Users, Megaphone, Instagram, Facebook,
    Linkedin, Twitter, Youtube, Search, MessageSquare, MapPin,
    Newspaper, Radio, Tv, Building2, BookOpen, Share2, QrCode,
    Rss, HeartHandshake, ArrowRightLeft, Smartphone, type LucideIcon,
} from "lucide-react";

/** Available source icon keys and their Lucide components */
export const SOURCE_ICON_MAP: Record<string, LucideIcon> = {
    globe: Globe,
    phone: Phone,
    mail: Mail,
    users: Users,
    megaphone: Megaphone,
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    youtube: Youtube,
    search: Search,
    message: MessageSquare,
    location: MapPin,
    newspaper: Newspaper,
    radio: Radio,
    tv: Tv,
    building: Building2,
    book: BookOpen,
    share: Share2,
    qrcode: QrCode,
    rss: Rss,
    referral: HeartHandshake,
    transfer: ArrowRightLeft,
    mobile: Smartphone,
};

/** All available source icon keys for the picker UI */
export const SOURCE_ICON_OPTIONS = Object.keys(SOURCE_ICON_MAP);

/** Get a Lucide component for a source icon key, fallback to Globe */
export function getSourceIconComponent(iconKey?: string): LucideIcon {
    if (!iconKey) return Globe;
    return SOURCE_ICON_MAP[iconKey] || Globe;
}

/** Common emoji options for status picker */
export const STATUS_EMOJI_OPTIONS = [
    "🔥", "⭐", "✅", "❌", "⏳", "🎯", "💰", "🏆", "📞", "📧",
    "🤝", "🚀", "💎", "🔔", "📋", "🛑", "⚠️", "💬", "🎉", "👤",
    "📦", "🔑", "❤️", "👁️", "📊", "🕐", "🔄", "➡️", "✨", "🏷️",
];

/**
 * Resolve the emoji for a status key from settings.
 * Returns the emoji string or empty string if none set.
 */
export function getStatusEmoji(statuses: any[] | undefined, statusKey: string): string {
    if (!statuses) return "";
    const found = statuses.find((s: any) => s.key === statusKey);
    return found?.emoji || "";
}

/**
 * Resolve the icon key for a source from settings.
 * Returns the icon key string (e.g. "instagram") or empty string.
 */
export function getSourceIconKey(sources: any[] | undefined, sourceKey: string): string {
    if (!sources) return "";
    const found = sources.find((s: any) => s.key === sourceKey);
    return found?.icon || "";
}

