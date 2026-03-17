/**
 * @module lib/utils/passwordStrength
 * @description Shared password strength calculator used across TeamTab and AccountTab.
 */

export interface PasswordStrength {
    score: number;      // 0–5
    label: string;      // "Weak" | "Fair" | "Good" | "Strong"
    color: string;      // Tailwind bg class
    textColor: string;  // Tailwind text class
}

export function getPasswordStrength(pw: string): PasswordStrength {
    if (!pw) return { score: 0, label: "", color: "", textColor: "" };

    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score, label: "Weak",   color: "bg-red-500",     textColor: "text-red-400" };
    if (score <= 2) return { score, label: "Fair",   color: "bg-amber-500",   textColor: "text-amber-400" };
    if (score <= 3) return { score, label: "Good",   color: "bg-blue-500",    textColor: "text-blue-400" };
    return              { score, label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-400" };
}

/** Renders the 5-segment strength bar — returns segment fill classes */
export function getStrengthSegments(score: number, color: string): string[] {
    return [1, 2, 3, 4, 5].map(i =>
        i <= score ? color : "bg-white/10"
    );
}
