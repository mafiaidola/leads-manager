"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Organization from "@/models/Organization";
import User from "@/models/User";
import Lead from "@/models/Lead";
import LeadNote from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";
import { serialize } from "@/lib/serialize";

// ─── Export full backup for an organization ─────────────────────────────────
export async function exportOrgBackup(orgId: string) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return { error: "Unauthorized" };

    try {
        await dbConnect();
        const org = await Organization.findById(orgId).lean();
        if (!org) return { error: "Organization not found" };

        // Fetch all org-scoped data in parallel
        const [users, leads, notes, actions, auditLogs, notifications] = await Promise.all([
            User.find({ orgId }).select("-passwordHash").lean(),
            Lead.find({ orgId }).lean(),
            LeadNote.find({ orgId }).lean(),
            LeadAction.find({ orgId }).lean(),
            AuditLog.find({ orgId }).sort({ createdAt: -1 }).limit(5000).lean(),
            Notification.find({ orgId }).sort({ createdAt: -1 }).limit(2000).lean(),
        ]);

        const backup = {
            _meta: {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                exportedBy: session.user.name || "SuperAdmin",
                orgName: org.name,
                orgSlug: org.slug,
            },
            organization: org,
            users,
            leads,
            notes,
            actions,
            auditLogs,
            notifications,
            _stats: {
                users: users.length,
                leads: leads.length,
                notes: notes.length,
                actions: actions.length,
                auditLogs: auditLogs.length,
                notifications: notifications.length,
            },
        };

        return { success: true, data: serialize(backup) };
    } catch (error: any) {
        console.error("exportOrgBackup error:", error);
        return { error: error.message || "Export failed" };
    }
}

// ─── Restore backup into an organization ────────────────────────────────────
export async function restoreOrgBackup(
    orgId: string,
    backup: any,
    options: { mode: "replace" | "merge" } = { mode: "merge" }
) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return { error: "Unauthorized" };

    try {
        await dbConnect();
        const org = await Organization.findById(orgId);
        if (!org) return { error: "Organization not found" };

        // Validate backup structure
        if (!backup?._meta?.version || !backup?.organization) {
            return { error: "Invalid backup file — missing metadata or organization data" };
        }

        const stats = { leads: 0, notes: 0, actions: 0, auditLogs: 0 };

        // Restore org settings & branding
        if (backup.organization?.settings) {
            org.settings = backup.organization.settings;
        }
        if (backup.organization?.branding) {
            org.branding = backup.organization.branding;
        }
        if (backup.organization?.theme) {
            org.theme = backup.organization.theme;
        }
        await org.save();

        // In replace mode, clear existing data first
        if (options.mode === "replace") {
            await Promise.all([
                Lead.deleteMany({ orgId }),
                LeadNote.deleteMany({ orgId }),
                LeadAction.deleteMany({ orgId }),
            ]);
        }

        // Restore leads (re-map orgId)
        if (backup.leads?.length > 0) {
            const leadsToInsert = backup.leads.map((lead: any) => {
                const { _id, __v, ...rest } = lead;
                return { ...rest, orgId };
            });
            // Use insertMany with ordered:false to skip duplicates
            try {
                const result = await Lead.insertMany(leadsToInsert, { ordered: false });
                stats.leads = result.length;
            } catch (e: any) {
                // BulkWriteError — partial success is fine
                stats.leads = e.insertedDocs?.length || 0;
            }
        }

        // Restore notes
        if (backup.notes?.length > 0) {
            const notesToInsert = backup.notes.map((note: any) => {
                const { _id, __v, ...rest } = note;
                return { ...rest, orgId };
            });
            try {
                const result = await LeadNote.insertMany(notesToInsert, { ordered: false });
                stats.notes = result.length;
            } catch (e: any) {
                stats.notes = e.insertedDocs?.length || 0;
            }
        }

        // Restore actions
        if (backup.actions?.length > 0) {
            const actionsToInsert = backup.actions.map((action: any) => {
                const { _id, __v, ...rest } = action;
                return { ...rest, orgId };
            });
            try {
                const result = await LeadAction.insertMany(actionsToInsert, { ordered: false });
                stats.actions = result.length;
            } catch (e: any) {
                stats.actions = e.insertedDocs?.length || 0;
            }
        }

        // Log the restore in audit
        await AuditLog.create({
            orgId,
            userId: session.user.id,
            userName: session.user.name || "SuperAdmin",
            action: "RESTORE",
            entityType: "settings",
            entityId: orgId,
            details: `Restored backup from ${backup._meta.exportedAt}. Mode: ${options.mode}. Stats: ${JSON.stringify(stats)}`,
        });

        return {
            success: true,
            message: `Restore complete. ${stats.leads} leads, ${stats.notes} notes, ${stats.actions} actions restored.`,
            stats,
        };
    } catch (error: any) {
        console.error("restoreOrgBackup error:", error);
        return { error: error.message || "Restore failed" };
    }
}

// ─── Get backup info (last backup audit entry) ──────────────────────────────
export async function getOrgBackupInfo(orgId: string) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return null;

    try {
        await dbConnect();
        const lastRestore = await AuditLog.findOne({
            orgId,
            action: "RESTORE",
        })
            .sort({ createdAt: -1 })
            .select("createdAt details userName")
            .lean();

        return serialize(lastRestore);
    } catch {
        return null;
    }
}
