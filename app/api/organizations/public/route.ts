import { NextResponse } from "next/server";
/**
 * @route GET /api/organizations/public
 * @description Public endpoint returning active org list (name, slug, branding).
 * Used by the login page org selector — no authentication required.
 *
 * Performance: Response is cached for 5 minutes via Cache-Control headers
 * and Next.js revalidation to minimize cold-start DB hits on login page.
 */
import dbConnect from "@/lib/db";
import Organization from "@/models/Organization";

// Cache this route's response for 5 minutes (login page doesn't need real-time data)
export const revalidate = 300;

/**
 * Public API — returns list of active organizations for login page selector.
 * No authentication required.
 */
export async function GET() {
    try {
        await dbConnect();
        const orgs = await Organization.find({ active: true })
            .select("name slug branding.logoUrl branding.appName branding.accentColor branding.loginTheme")
            .sort({ name: 1 })
            .lean();

        return NextResponse.json(
            orgs.map((o: any) => ({
                slug: o.slug,
                name: o.name,
                logo: o.branding?.logoUrl || "",
                appName: o.branding?.appName || o.name,
                accentColor: o.branding?.accentColor || "#8b5cf6",
                loginTheme: o.branding?.loginTheme || "aurora",
            })),
            {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                },
            }
        );
    } catch (error) {
        console.error("Failed to fetch organizations:", error);
        return NextResponse.json([], { status: 500 });
    }
}
