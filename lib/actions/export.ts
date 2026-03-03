"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import mongoose from "mongoose";

/**
 * Export org leads data in various formats.
 * Returns raw data for client-side Excel/PDF generation.
 */
export async function getOrgExportData(orgId: string) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return { error: "Unauthorized" };

    try {
        await dbConnect();
        const leads = await Lead.find({
            orgId: new mongoose.Types.ObjectId(orgId),
            deletedAt: null,
        })
            .select("name phone email source status product company notes assignedTo createdAt")
            .sort({ createdAt: -1 })
            .lean();

        const Organization = (await import("@/models/Organization")).default;
        const org = await Organization.findById(orgId).select("name slug").lean();

        return {
            orgName: (org as any)?.name || "Organization",
            orgSlug: (org as any)?.slug || "org",
            leads: leads.map((l: any) => ({
                name: l.name || "",
                phone: l.phone || "",
                email: l.email || "",
                source: l.source || "",
                status: l.status || "",
                product: l.product || "",
                company: l.company || "",
                notes: l.notes || "",
                assignedTo: l.assignedTo || "",
                createdAt: l.createdAt?.toISOString?.() || "",
            })),
        };
    } catch (error: any) {
        console.error("getOrgExportData error:", error);
        return { error: error.message || "Export failed" };
    }
}
