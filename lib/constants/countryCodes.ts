/**
 * @module lib/constants/countryCodes
 * @description Country code data for phone input components.
 *
 * Exports:
 * - `countryCodes` — full list with GCC countries prioritised at top
 * - `DEFAULT_COUNTRY_CODE` — default dial code ("+966" Saudi Arabia)
 * - `formatPhoneDisplay(countryCode, phone)` — formats for display
 * - `getFlagForDialCode(dialCode)` — returns emoji flag for a dial code
 *
 * Used by `PhoneInputWithCountry` component.
 */
export interface CountryCode {
    code: string;   // ISO 3166-1 alpha-2
    dial: string;   // International dialing code (digits only)
    name: string;
    flag: string;   // Emoji flag
}

/**
 * Country codes list — GCC countries first, then common international sorted alphabetically.
 */
export const COUNTRY_CODES: CountryCode[] = [
    // ── GCC (prioritized) ──
    { code: "AE", dial: "971", name: "UAE", flag: "🇦🇪" },
    { code: "SA", dial: "966", name: "Saudi Arabia", flag: "🇸🇦" },
    { code: "QA", dial: "974", name: "Qatar", flag: "🇶🇦" },
    { code: "KW", dial: "965", name: "Kuwait", flag: "🇰🇼" },
    { code: "BH", dial: "973", name: "Bahrain", flag: "🇧🇭" },
    { code: "OM", dial: "968", name: "Oman", flag: "🇴🇲" },
    // ── Middle East & North Africa ──
    { code: "JO", dial: "962", name: "Jordan", flag: "🇯🇴" },
    { code: "LB", dial: "961", name: "Lebanon", flag: "🇱🇧" },
    { code: "IQ", dial: "964", name: "Iraq", flag: "🇮🇶" },
    { code: "EG", dial: "20", name: "Egypt", flag: "🇪🇬" },
    { code: "MA", dial: "212", name: "Morocco", flag: "🇲🇦" },
    { code: "TN", dial: "216", name: "Tunisia", flag: "🇹🇳" },
    { code: "DZ", dial: "213", name: "Algeria", flag: "🇩🇿" },
    { code: "LY", dial: "218", name: "Libya", flag: "🇱🇾" },
    { code: "PS", dial: "970", name: "Palestine", flag: "🇵🇸" },
    { code: "SY", dial: "963", name: "Syria", flag: "🇸🇾" },
    { code: "YE", dial: "967", name: "Yemen", flag: "🇾🇪" },
    { code: "SD", dial: "249", name: "Sudan", flag: "🇸🇩" },
    // ── South Asia ──
    { code: "IN", dial: "91", name: "India", flag: "🇮🇳" },
    { code: "PK", dial: "92", name: "Pakistan", flag: "🇵🇰" },
    { code: "BD", dial: "880", name: "Bangladesh", flag: "🇧🇩" },
    { code: "LK", dial: "94", name: "Sri Lanka", flag: "🇱🇰" },
    { code: "NP", dial: "977", name: "Nepal", flag: "🇳🇵" },
    // ── East & Southeast Asia ──
    { code: "CN", dial: "86", name: "China", flag: "🇨🇳" },
    { code: "PH", dial: "63", name: "Philippines", flag: "🇵🇭" },
    { code: "ID", dial: "62", name: "Indonesia", flag: "🇮🇩" },
    // ── Europe ──
    { code: "GB", dial: "44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "DE", dial: "49", name: "Germany", flag: "🇩🇪" },
    { code: "FR", dial: "33", name: "France", flag: "🇫🇷" },
    { code: "IT", dial: "39", name: "Italy", flag: "🇮🇹" },
    { code: "ES", dial: "34", name: "Spain", flag: "🇪🇸" },
    { code: "NL", dial: "31", name: "Netherlands", flag: "🇳🇱" },
    { code: "TR", dial: "90", name: "Turkey", flag: "🇹🇷" },
    { code: "RU", dial: "7", name: "Russia", flag: "🇷🇺" },
    // ── Americas ──
    { code: "US", dial: "1", name: "United States", flag: "🇺🇸" },
    { code: "CA", dial: "1", name: "Canada", flag: "🇨🇦" },
    { code: "BR", dial: "55", name: "Brazil", flag: "🇧🇷" },
    // ── Africa ──
    { code: "NG", dial: "234", name: "Nigeria", flag: "🇳🇬" },
    { code: "KE", dial: "254", name: "Kenya", flag: "🇰🇪" },
    { code: "ZA", dial: "27", name: "South Africa", flag: "🇿🇦" },
    { code: "ET", dial: "251", name: "Ethiopia", flag: "🇪🇹" },
    // ── Oceania ──
    { code: "AU", dial: "61", name: "Australia", flag: "🇦🇺" },
];

/** Default country code for UAE */
export const DEFAULT_COUNTRY_CODE = "971";

/** Serial number prefix */
export const SERIAL_PREFIX = "LM";

/**
 * Format a phone number for display: +971 50 123 4567
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
    if (!phone) return "";
    // Already has digits only
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length <= 3) return `+${digits}`;

    // Find matching country code (try longest match first)
    const match = COUNTRY_CODES.find((c) => digits.startsWith(c.dial));
    if (match) {
        const local = digits.slice(match.dial.length);
        // Group local digits in chunks of 3 from the right
        const formatted = local.replace(/(\d{2,3})(?=\d)/g, "$1 ");
        return `+${match.dial} ${formatted}`.trim();
    }

    // Fallback: just add + and space every 3 digits
    return `+${digits.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
}

/**
 * Get the flag emoji for a dial code.
 */
export function getFlagForDialCode(dial: string): string {
    return COUNTRY_CODES.find((c) => c.dial === dial)?.flag || "🌍";
}
