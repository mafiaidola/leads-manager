/**
 * @module lib/utils/permissions
 * @description Permission checker for custom roles enforcement.
 *
 * Built-in role permission map:
 *   ADMIN      → all permissions
 *   MARKETING  → create leads, view leads, view reports
 *   SALES      → view assigned leads, update assigned leads, add notes
 *
 * Custom roles: defined per-org in `organization.settings.customRoles`.
 * Each custom role has a `permissions: string[]` array.
 *
 * Usage:
 *   const can = await checkPermission(session, "leads.create");
 */

import dbConnect from "@/lib/db";
import Organization from "@/models/Organization";

// ─── Permission constants ──────────────────────────────────────────────────

export const PERMISSIONS = {
    // Leads
    LEADS_CREATE: "leads.create",
    LEADS_VIEW: "leads.view",
    LEADS_VIEW_ALL: "leads.view_all",
    LEADS_EDIT: "leads.edit",
    LEADS_EDIT_ALL: "leads.edit_all",
    LEADS_DELETE: "leads.delete",
    LEADS_IMPORT: "leads.import",
    LEADS_EXPORT: "leads.export",
    LEADS_TRANSFER: "leads.transfer",

    // Reports
    REPORTS_VIEW: "reports.view",

    // Settings
    SETTINGS_VIEW: "settings.view",
    SETTINGS_EDIT: "settings.edit",

    // Team
    TEAM_VIEW: "team.view",
    TEAM_MANAGE: "team.manage",

    // Backup
    BACKUP_EXPORT: "backup.export",
    BACKUP_RESTORE: "backup.restore",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Built-in role permission map ──────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN: Object.values(PERMISSIONS), // All permissions
    MARKETING: [
        PERMISSIONS.LEADS_CREATE,
        PERMISSIONS.LEADS_VIEW,
        PERMISSIONS.LEADS_VIEW_ALL,
        PERMISSIONS.LEADS_IMPORT,
        PERMISSIONS.LEADS_EXPORT,
        PERMISSIONS.LEADS_TRANSFER,
        PERMISSIONS.REPORTS_VIEW,
    ],
    SALES: [
        PERMISSIONS.LEADS_VIEW,
        PERMISSIONS.LEADS_EDIT,
    ],
};

// ─── Permission check functions ────────────────────────────────────────────

/**
 * Check if a user's role (built-in or custom) has a specific permission.
 * Falls back to built-in role map if no custom role match.
 */
export async function checkPermission(
    session: any,
    permission: string
): Promise<boolean> {
    if (!session?.user) return false;

    const userRole = session.user.role as string;
    const isSuperAdmin = session.user.isSuperAdmin;

    // SuperAdmin bypasses all checks
    if (isSuperAdmin) return true;

    // Check built-in roles first
    const builtInPerms = ROLE_PERMISSIONS[userRole];
    if (builtInPerms) {
        return builtInPerms.includes(permission);
    }

    // Custom role — look up in org settings
    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId)
            .select("settings.customRoles")
            .lean() as any;

        if (!org?.settings?.customRoles) return false;

        const customRole = org.settings.customRoles.find(
            (r: any) => r.name === userRole
        );

        return customRole?.permissions?.includes(permission) || false;
    } catch {
        return false;
    }
}

/**
 * Synchronous check for built-in roles only (no DB call).
 * Use when you already know the role is a built-in one.
 */
export function hasBuiltInPermission(role: string, permission: string): boolean {
    const perms = ROLE_PERMISSIONS[role];
    return perms ? perms.includes(permission) : false;
}

/**
 * Get all available permissions with labels for the Roles settings UI.
 */
export function getAvailablePermissions(): { key: string; label: string; group: string }[] {
    return [
        { key: PERMISSIONS.LEADS_CREATE, label: "Create Leads", group: "Leads" },
        { key: PERMISSIONS.LEADS_VIEW, label: "View Own Leads", group: "Leads" },
        { key: PERMISSIONS.LEADS_VIEW_ALL, label: "View All Leads", group: "Leads" },
        { key: PERMISSIONS.LEADS_EDIT, label: "Edit Own Leads", group: "Leads" },
        { key: PERMISSIONS.LEADS_EDIT_ALL, label: "Edit All Leads", group: "Leads" },
        { key: PERMISSIONS.LEADS_DELETE, label: "Delete Leads", group: "Leads" },
        { key: PERMISSIONS.LEADS_IMPORT, label: "Import Leads", group: "Leads" },
        { key: PERMISSIONS.LEADS_EXPORT, label: "Export Leads", group: "Leads" },
        { key: PERMISSIONS.LEADS_TRANSFER, label: "Transfer Leads", group: "Leads" },
        { key: PERMISSIONS.REPORTS_VIEW, label: "View Reports", group: "Reports" },
        { key: PERMISSIONS.SETTINGS_VIEW, label: "View Settings", group: "Settings" },
        { key: PERMISSIONS.SETTINGS_EDIT, label: "Edit Settings", group: "Settings" },
        { key: PERMISSIONS.TEAM_VIEW, label: "View Team", group: "Team" },
        { key: PERMISSIONS.TEAM_MANAGE, label: "Manage Team", group: "Team" },
        { key: PERMISSIONS.BACKUP_EXPORT, label: "Export Backup", group: "System" },
        { key: PERMISSIONS.BACKUP_RESTORE, label: "Restore Backup", group: "System" },
    ];
}
