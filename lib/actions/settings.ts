/**
 * @module lib/actions/settings
 * @description Server actions for organisation settings management.
 *
 * Exports:
 * - `getSettings` — retrieves org settings for current user's org
 * - `updateSettings` — updates statuses, sources, products, custom fields, goals
 * - `updateBranding` — updates appName, logoUrl, accentColor
 * - `resetPassword` — admin-initiated password reset for a user
 * - `changeMyPassword` — self-service password change with old-password verification
 *
 * All mutations log audit entries and validate admin privileges.
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Organization from "@/models/Organization";
import { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";

/**
 * Get settings for the current user's organization.
 * Settings are now embedded in the Organization document.
 */
export async function getSettings() {
    const session = await auth();
    if (!session?.user?.orgId) return null;

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId);
        if (!org) return null;

        // Auto-backfill: if products array is empty, seed with defaults (legacy orgs)
        let products = org.settings?.products || [];
        if (products.length === 0) {
            const defaultProducts = [
                { key: "general", label: "General Inquiry" },
                { key: "service_a", label: "Service A" },
                { key: "service_b", label: "Service B" },
            ];
            org.settings.products = defaultProducts;
            await org.save();
            products = defaultProducts;
        }

        // JSON round-trip to strip Mongoose ObjectIds from sub-documents
        const safe = JSON.parse(JSON.stringify({
            statuses: org.settings?.statuses || [],
            sources: org.settings?.sources || [],
            products,
            customFields: org.settings?.customFields || [],
            customRoles: org.settings?.customRoles || [],
            goals: org.settings?.goals || { monthlyLeadTarget: 50, monthlyConversionTarget: 10 },
            branding: org.branding || { appName: "Leads Mgr", accentColor: "#8b5cf6", logoUrl: "" },
            theme: org.theme || "violet",
        }));
        return safe;
    } catch (error) {
        console.error("getSettings error:", error);
        return null;
    }
}

/**
 * Update general settings (statuses, sources, products, custom fields, custom roles).
 */
export async function updateSettings(data: {
    statuses?: any[];
    sources?: any[];
    products?: any[];
    customFields?: any[];
    customRoles?: any[];
}) {
    const session = await auth();
    if (!session?.user?.orgId || session.user.role !== USER_ROLES.ADMIN) {
        return { error: "Unauthorized" };
    }

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId);
        if (!org) return { error: "Organization not found" };

        if (data.statuses) org.settings.statuses = data.statuses;
        if (data.sources) org.settings.sources = data.sources;
        if (data.products) org.settings.products = data.products;
        if (data.customFields) org.settings.customFields = data.customFields;
        if (data.customRoles) org.settings.customRoles = data.customRoles;

        await org.save();
        revalidatePath("/settings");
        revalidatePath("/leads");
        revalidatePath("/");
        return { message: "Settings updated successfully", success: true };
    } catch (error) {
        console.error("updateSettings error:", error);
        return { error: "Failed to update settings" };
    }
}

/**
 * Update branding for the current organization.
 */
export async function updateBranding(data: {
    appName?: string;
    accentColor?: string;
    logoUrl?: string;
}) {
    const session = await auth();
    if (!session?.user?.orgId || session.user.role !== USER_ROLES.ADMIN) {
        return { error: "Unauthorized" };
    }

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId);
        if (!org) return { error: "Organization not found" };

        // Ensure branding subdocument exists (for orgs created before this field was added)
        if (!org.branding) {
            org.branding = { appName: "Leads Mgr", accentColor: "#8b5cf6", logoUrl: "" };
        }

        if (data.appName !== undefined) org.branding.appName = data.appName;
        if (data.accentColor !== undefined) org.branding.accentColor = data.accentColor;
        if (data.logoUrl !== undefined) org.branding.logoUrl = data.logoUrl;

        await org.save();
        revalidatePath("/settings");
        revalidatePath("/");
        return { message: "Branding updated successfully", success: true };
    } catch (error) {
        console.error("updateBranding error:", error);
        return { error: "Failed to update branding" };
    }
}

/**
 * Update monthly goals for the current organization.
 */
export async function updateGoals(data: {
    monthlyLeadTarget?: number;
    monthlyConversionTarget?: number;
}) {
    const session = await auth();
    if (!session?.user?.orgId || session.user.role !== USER_ROLES.ADMIN) {
        return { error: "Unauthorized" };
    }

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId);
        if (!org) return { error: "Organization not found" };

        if (data.monthlyLeadTarget !== undefined) org.settings.goals.monthlyLeadTarget = data.monthlyLeadTarget;
        if (data.monthlyConversionTarget !== undefined) org.settings.goals.monthlyConversionTarget = data.monthlyConversionTarget;

        await org.save();
        revalidatePath("/settings");
        revalidatePath("/");
        return { message: "Goals updated successfully", success: true };
    } catch (error) {
        console.error("updateGoals error:", error);
        return { error: "Failed to update goals" };
    }
}

/**
 * Update theme for the current organization.
 */
export async function updateTheme(theme: "violet" | "ocean" | "emerald") {
    const session = await auth();
    if (!session?.user?.orgId || session.user.role !== USER_ROLES.ADMIN) {
        return { error: "Unauthorized" };
    }

    try {
        await dbConnect();
        await Organization.findByIdAndUpdate(session.user.orgId, { theme });
        revalidatePath("/settings");
        revalidatePath("/");
        return { message: "Theme updated successfully", success: true };
    } catch (error) {
        console.error("updateTheme error:", error);
        return { error: "Failed to update theme" };
    }
}
