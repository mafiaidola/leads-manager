/**
 * @module lib/utils/leadScoring
 * @description Auto-calculates a lead quality score (0–100) based on data completeness,
 * engagement signals, and deal value. Used in lead lists and reports.
 *
 * Scoring breakdown:
 *   Data completeness (40 pts max): name, email, phone, company, address, website
 *   Engagement signals (35 pts max): contacted, follow-up set, notes count, star
 *   Deal signals (25 pts max): value, product, source
 */

export interface LeadScoreResult {
    score: number;        // 0–100
    grade: "A" | "B" | "C" | "D" | "F";
    color: string;        // Tailwind color class
    breakdown: {
        completeness: number;
        engagement: number;
        deal: number;
    };
}

/**
 * Calculate a lead's quality score.
 */
export function calculateLeadScore(lead: any): LeadScoreResult {
    let completeness = 0;
    let engagement = 0;
    let deal = 0;

    // ── Data Completeness (40 pts) ──────────────────────────────────────────
    if (lead.name) completeness += 8;
    if (lead.email) completeness += 8;
    if (lead.phone) completeness += 8;
    if (lead.company) completeness += 6;
    if (lead.address?.city || lead.address?.country) completeness += 5;
    if (lead.website) completeness += 5;

    // ── Engagement Signals (35 pts) ─────────────────────────────────────────
    if (lead.contactedToday || lead.lastContactAt) engagement += 10;
    if (lead.followUpDate) {
        engagement += 8;
        // Bonus if follow-up is upcoming (not overdue)
        const followUp = new Date(lead.followUpDate);
        if (followUp >= new Date()) engagement += 4;
    }
    // Notes count (if available)
    const notesCount = lead.notesCount || 0;
    if (notesCount >= 5) engagement += 10;
    else if (notesCount >= 2) engagement += 6;
    else if (notesCount >= 1) engagement += 3;
    // Starred
    if (lead.starred?.length > 0) engagement += 3;

    // ── Deal Signals (25 pts) ───────────────────────────────────────────────
    if (lead.value && lead.value > 0) {
        deal += 10;
        // Higher value = more points
        if (lead.value >= 50000) deal += 5;
        else if (lead.value >= 10000) deal += 3;
    }
    if (lead.product) deal += 5;
    if (lead.source) deal += 5;

    const score = Math.min(100, completeness + engagement + deal);

    // Grade assignment
    let grade: LeadScoreResult["grade"];
    let color: string;

    if (score >= 80) { grade = "A"; color = "text-emerald-400"; }
    else if (score >= 60) { grade = "B"; color = "text-blue-400"; }
    else if (score >= 40) { grade = "C"; color = "text-amber-400"; }
    else if (score >= 20) { grade = "D"; color = "text-orange-400"; }
    else { grade = "F"; color = "text-red-400"; }

    return { score, grade, color, breakdown: { completeness, engagement, deal } };
}

/**
 * Get score color for progress bars and badges.
 */
export function getScoreBgColor(score: number): string {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
}
