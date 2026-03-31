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
import { logAudit } from "@/lib/actions/audit";
import { AUDIT_ACTIONS, ENTITY_TYPES } from "@/models/AuditLog";

/**
 * Get settings for the current user's organization.
 * Settings are now embedded in the Organization document.
 */
export async function getSettings() {
    const session = await auth();
    if (!session?.user?.orgId) return null;

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId).lean() as any;
        if (!org) return null;

        // Auto-backfill: if products array is empty, seed with defaults (legacy orgs)
        let products = org.settings?.products || [];
        if (products.length === 0) {
            const defaultProducts = [
                { key: "general", label: "General Inquiry" },
                { key: "service_a", label: "Service A" },
                { key: "service_b", label: "Service B" },
            ];
            await Organization.updateOne(
                { _id: session.user.orgId },
                { $set: { "settings.products": defaultProducts } }
            );
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
            defaultCurrency: org.settings?.defaultCurrency || "AED",
            autoAssignStrategy: org.settings?.autoAssignStrategy || "none",
            notifPrefs: org.settings?.notificationPreferences || { onNewLead: true, onAssigned: true, onLeadUpdated: true, onStatusChange: true, onLeadTransferred: true, onLeadDeleted: true, onBulkAction: true },
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

        if (data.statuses !== undefined) org.settings.statuses = data.statuses;
        if (data.sources !== undefined) org.settings.sources = data.sources;
        if (data.products !== undefined) org.settings.products = data.products;
        if (data.customFields !== undefined) org.settings.customFields = data.customFields;
        if (data.customRoles !== undefined) org.settings.customRoles = data.customRoles;

        await org.save();
        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.SETTINGS, org._id.toString(), "Updated general settings (statuses, sources, products, custom fields, roles)");
        revalidatePath("/settings");
        revalidatePath("/leads");
        revalidatePath("/");
        return { message: "Settings updated successfully", success: true };
    } catch (error: any) {
        console.error("updateSettings error:", error?.message || error);
        return { error: error?.message || "Failed to update settings" };
    }
}

/**
 * Update branding for the current organization.
 */
export async function updateBranding(data: {
    appName?: string;
    accentColor?: string;
    logoUrl?: string;
    loginTheme?: string;
}) {
    const session = await auth();
    if (!session?.user?.orgId || session.user.role !== USER_ROLES.ADMIN) {
        return { error: "Unauthorized" };
    }

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId);
        if (!org) {
            console.error("updateBranding: Organization not found for orgId:", session.user.orgId);
            return { error: "Organization not found" };
        }

        // Ensure branding subdocument exists (for orgs created before this field was added)
        if (!org.branding) {
            org.branding = { appName: "Leads Mgr", accentColor: "#8b5cf6", logoUrl: "", loginTheme: "aurora" };
        }

        if (data.appName !== undefined) {
            org.branding.appName = data.appName;
            // Also sync the top-level org.name so login dropdown reflects the appName
            org.name = data.appName;
        }
        if (data.accentColor !== undefined) org.branding.accentColor = data.accentColor;
        if (data.logoUrl !== undefined) org.branding.logoUrl = data.logoUrl;
        if (data.loginTheme !== undefined) org.branding.loginTheme = data.loginTheme;

        await org.save();
        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.SETTINGS, org._id.toString(), `Updated branding: ${data.appName || ""} accent=${data.accentColor || ""}`);
        // Revalidate all routes that display branding or theme
        revalidatePath("/settings");
        revalidatePath("/");
        revalidatePath("/leads");
        revalidatePath("/reports");
        revalidatePath("/login");
        revalidatePath("/quality");
        return { message: "Branding updated successfully", success: true };
    } catch (error: any) {
        console.error("updateBranding error:", error?.message || error);
        return { error: error?.message || "Failed to update branding" };
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
        // Revalidate all routes so every user picks up the new theme on next page load
        revalidatePath("/settings");
        revalidatePath("/");
        revalidatePath("/leads");
        revalidatePath("/reports");
        revalidatePath("/quality");
        revalidatePath("/audit");
        revalidatePath("/attendance");
        return { message: "Theme updated successfully", success: true };
    } catch (error) {
        console.error("updateTheme error:", error);
        return { error: "Failed to update theme" };
    }
}

/**
 * Update notification preferences for the current organization.
 */
export async function updateNotificationPrefs(prefs: {
    onNewLead?: boolean;
    onAssigned?: boolean;
    onLeadUpdated?: boolean;
    onStatusChange?: boolean;
    onLeadTransferred?: boolean;
    onLeadDeleted?: boolean;
    onBulkAction?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.orgId || session.user.role !== USER_ROLES.ADMIN) return { error: "Unauthorized" };

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId);
        if (!org) return { error: "Organization not found" };

        if (!org.settings.notificationPreferences) {
            org.settings.notificationPreferences = {
                onNewLead: true, onAssigned: true, onLeadUpdated: true,
                onStatusChange: true, onLeadTransferred: true, onLeadDeleted: true, onBulkAction: true,
            };
        }
        const np = org.settings.notificationPreferences;
        if (prefs.onNewLead !== undefined) np.onNewLead = prefs.onNewLead;
        if (prefs.onAssigned !== undefined) np.onAssigned = prefs.onAssigned;
        if (prefs.onLeadUpdated !== undefined) np.onLeadUpdated = prefs.onLeadUpdated;
        if (prefs.onStatusChange !== undefined) np.onStatusChange = prefs.onStatusChange;
        if (prefs.onLeadTransferred !== undefined) np.onLeadTransferred = prefs.onLeadTransferred;
        if (prefs.onLeadDeleted !== undefined) np.onLeadDeleted = prefs.onLeadDeleted;
        if (prefs.onBulkAction !== undefined) np.onBulkAction = prefs.onBulkAction;

        await org.save();
        revalidatePath("/settings");
        return { message: "Notification preferences saved", success: true };
    } catch (error) {
        console.error("updateNotificationPrefs error:", error);
        return { error: "Failed to update notification preferences" };
    }
}

/**
 * Update default currency for the current organization.
 */
export async function updateCurrency(currency: string) {
    const session = await auth();
    if (!session?.user?.orgId || session.user.role !== USER_ROLES.ADMIN) {
        return { error: "Unauthorized" };
    }

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId);
        if (!org) return { error: "Organization not found" };

        org.settings.defaultCurrency = currency;
        await org.save();
        revalidatePath("/settings");
        revalidatePath("/leads");
        return { message: "Currency updated", success: true };
    } catch (error) {
        console.error("updateCurrency error:", error);
        return { error: "Failed to update currency" };
    }
}

/**
 * Update auto-assignment strategy for the current organization.
 */
export async function updateAutoAssignStrategy(strategy: "round_robin" | "least_loaded" | "none") {
    const session = await auth();
    if (!session?.user?.orgId || session.user.role !== USER_ROLES.ADMIN) {
        return { error: "Unauthorized" };
    }

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId);
        if (!org) return { error: "Organization not found" };

        org.settings.autoAssignStrategy = strategy;
        await org.save();
        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.SETTINGS, org._id.toString(), `Auto-assign strategy changed to: ${strategy}`);
        revalidatePath("/settings");
        return { message: "Auto-assignment strategy updated", success: true };
    } catch (error) {
        console.error("updateAutoAssignStrategy error:", error);
        return { error: "Failed to update auto-assignment strategy" };
    }
}
