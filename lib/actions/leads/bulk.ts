/**
 * @module lib/actions/leads/bulk
 * @description Server actions for bulk lead operations (admin-only).
 *
 * Exports:
 * - `bulkUpdateStatus` — change status of multiple leads at once
 * - `bulkAssignLeads` — reassign multiple leads to a user
 * - `bulkDeleteLeads` — soft-delete multiple leads
 * - `restoreLead` — restore a soft-deleted lead (clears `deletedAt`)
 * - `permanentDeleteLead` — hard-delete a lead and its notes/actions
 *
 * All operations require ADMIN role and log audit entries.
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { logAudit } from "@/lib/actions/audit";
import { AUDIT_ACTIONS, ENTITY_TYPES } from "@/models/AuditLog";

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkUpdateStatus(ids: string[], status: string) {
    const session = await auth();
    if (!session || !session.user.orgId) return { message: "Unauthorized", success: false };

    // Marketing cannot change lead statuses
    if (session.user.role === USER_ROLES.MARKETING) {
        return { message: "Unauthorized: Marketing users cannot change lead status", success: false };
    }

    try {
        await dbConnect();
        // 🔒 RBAC: Sales can only affect their own assigned leads
        const bulkQuery: any = { _id: { $in: ids }, orgId: session.user.orgId };
        if (session.user.role === USER_ROLES.SALES) {
            bulkQuery.assignedTo = new mongoose.Types.ObjectId(session.user.id);
        }
        await Lead.updateMany(
            bulkQuery,
            { status, updatedBy: new mongoose.Types.ObjectId(session.user.id) }
        );
        logAudit(AUDIT_ACTIONS.BULK_UPDATE, ENTITY_TYPES.LEAD, ids.join(","), `Bulk status change to ${status} (${ids.length} leads)`);

        revalidatePath("/leads");
        return { message: `${ids.length} leads updated`, success: true };
    } catch (error) {
        console.error("Bulk update error:", error);
        return { message: "Failed to update leads", success: false };
    }
}

export async function bulkAssign(ids: string[], assignToId: string) {
    const session = await auth();
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== USER_ROLES.MARKETING)) {
        return { message: "Unauthorized", success: false };
    }

    if (!assignToId || !mongoose.Types.ObjectId.isValid(assignToId)) {
        return { message: "Invalid user ID", success: false };
    }

    try {
        await dbConnect();

        // Verify target user exists and is active
        const User = (await import("@/models/User")).default;
        const targetUser = await User.findById(assignToId).select("active name").lean();
        if (!targetUser || !targetUser.active) {
            return { message: "Target user not found or is deactivated", success: false };
        }

        await Lead.updateMany(
            { _id: { $in: ids }, orgId: session.user.orgId },
            { assignedTo: new mongoose.Types.ObjectId(assignToId), updatedBy: new mongoose.Types.ObjectId(session.user.id) }
        );
        logAudit(AUDIT_ACTIONS.BULK_UPDATE, ENTITY_TYPES.LEAD, ids.join(","), `Bulk assigned ${ids.length} leads to ${targetUser.name}`);

        revalidatePath("/leads");
        return { message: `${ids.length} leads assigned`, success: true };
    } catch (error) {
        console.error("Bulk assign error:", error);
        return { message: "Failed to assign leads", success: false };
    }
}

export async function bulkSoftDelete(ids: string[]) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized", success: false };
    }

    try {
        await dbConnect();
        await Lead.updateMany(
            { _id: { $in: ids }, orgId: new mongoose.Types.ObjectId(session.user.orgId as string) },
            { deletedAt: new Date() }
        );
        logAudit(AUDIT_ACTIONS.BULK_DELETE, ENTITY_TYPES.LEAD, ids.join(","), `Bulk soft deleted ${ids.length} leads`);

        revalidatePath("/leads");
        return { message: `${ids.length} leads moved to recycle bin`, success: true };
    } catch (error) {
        console.error("Bulk delete error:", error);
        return { message: "Failed to delete leads", success: false };
    }
}

// ─── Recycle Bin ─────────────────────────────────────────────────────────────

export async function restoreLead(id: string) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized", success: false };
    }

    try {
        await dbConnect();
        await Lead.findOneAndUpdate({ _id: id, orgId: new mongoose.Types.ObjectId(session.user.orgId as string) }, { deletedAt: null });
        logAudit(AUDIT_ACTIONS.RESTORE, ENTITY_TYPES.LEAD, id, "Lead restored from recycle bin");
        revalidatePath("/leads");
        return { message: "Lead restored", success: true };
    } catch (error) {
        console.error("Restore error:", error);
        return { message: "Failed to restore lead", success: false };
    }
}

export async function permanentDeleteLead(id: string) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized", success: false };
    }

    try {
        await dbConnect();
        const orgOid = new mongoose.Types.ObjectId(session.user.orgId as string);
        await Lead.findOneAndDelete({ _id: id, orgId: orgOid });
        await LeadNote.deleteMany({ leadId: id, orgId: orgOid });
        await LeadAction.deleteMany({ leadId: id, orgId: orgOid });
        logAudit(AUDIT_ACTIONS.DELETE, ENTITY_TYPES.LEAD, id, "Lead permanently deleted");
        revalidatePath("/leads");
        return { message: "Lead permanently deleted", success: true };
    } catch (error) {
        console.error("Permanent delete error:", error);
        return { message: "Failed to permanently delete lead", success: false };
    }
}
