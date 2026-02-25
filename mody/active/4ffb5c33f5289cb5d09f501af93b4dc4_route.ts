•/**
 * Public Leads API Route (No Auth Required)
 * 
 * POST /api/public/leads - Submit lead from funnel form
 * Captures leads from public funnels with UTM tracking.
 * 
 * Refactored: Business logic in /lib/services/public-leads.service.ts
 * ~55 lines - AI friendly
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { capturePublicLead } from "@/lib/services/public-leads.service";

const publicLeadSchema = z.object({
    funnel_id: z.string().uuid(),
    name: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = publicLeadSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const userAgent = request.headers.get("user-agent") || "";

        const context = {
            utmParams: {
                utm_source: searchParams.get("utm_source"),
                utm_medium: searchParams.get("utm_medium"),
                utm_campaign: searchParams.get("utm_campaign"),
                utm_content: searchParams.get("utm_content"),
                utm_term: searchParams.get("utm_term"),
            },
            deviceInfo: {
                device_type: /mobile/i.test(userAgent) ? "mobile" : /tablet/i.test(userAgent) ? "tablet" : "desktop",
                browser: userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : userAgent.includes("Safari") ? "Safari" : "Other",
            },
            referrer: request.headers.get("referer") || null,
        };

        const result = await capturePublicLead(parsed.data, context);
        if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

        return NextResponse.json({ success: true, message: "Lead captured successfully" }, { status: 201 });
    } catch (error) {
        console.error("Public leads POST error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
•"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72•file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/api/public/leads/route.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version