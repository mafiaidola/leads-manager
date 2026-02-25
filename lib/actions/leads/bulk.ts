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
    if (!session) return { message: "Unauthorized" };

    // Marketing cannot change lead statuses
    if (session.user.role === USER_ROLES.MARKETING) {
        return { message: "Unauthorized: Marketing users cannot change lead status" };
    }

    try {
        await dbConnect();
        await Lead.updateMany(
            { _id: { $in: ids } },
            { status, updatedBy: new mongoose.Types.ObjectId(session.user.id) }
        );
        logAudit(AUDIT_ACTIONS.BULK_UPDATE, ENTITY_TYPES.LEAD, ids.join(","), `Bulk status change to ${status} (${ids.length} leads)`);

        revalidatePath("/leads");
        return { message: `${ids.length} leads updated`, success: true };
    } catch (error) {
        console.error("Bulk update error:", error);
        return { message: "Failed to update leads" };
    }
}

export async function bulkAssign(ids: string[], assignToId: string) {
    const session = await auth();
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== USER_ROLES.MARKETING)) {
        return { message: "Unauthorized" };
    }

    if (!assignToId || !mongoose.Types.ObjectId.isValid(assignToId)) {
        return { message: "Invalid user ID" };
    }

    try {
        await dbConnect();

        // Verify target user exists and is active
        const User = (await import("@/models/User")).default;
        const targetUser = await User.findById(assignToId).select("active name").lean();
        if (!targetUser || !targetUser.active) {
            return { message: "Target user not found or is deactivated" };
        }

        await Lead.updateMany(
            { _id: { $in: ids } },
            { assignedTo: new mongoose.Types.ObjectId(assignToId), updatedBy: new mongoose.Types.ObjectId(session.user.id) }
        );
        logAudit(AUDIT_ACTIONS.BULK_UPDATE, ENTITY_TYPES.LEAD, ids.join(","), `Bulk assigned ${ids.length} leads to ${targetUser.name}`);

        revalidatePath("/leads");
        return { message: `${ids.length} leads assigned`, success: true };
    } catch (error) {
        console.error("Bulk assign error:", error);
        return { message: "Failed to assign leads" };
    }
}

export async function bulkSoftDelete(ids: string[]) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        await Lead.updateMany(
            { _id: { $in: ids } },
            { deletedAt: new Date() }
        );
        logAudit(AUDIT_ACTIONS.BULK_DELETE, ENTITY_TYPES.LEAD, ids.join(","), `Bulk soft deleted ${ids.length} leads`);

        revalidatePath("/leads");
        return { message: `${ids.length} leads moved to recycle bin`, success: true };
    } catch (error) {
        console.error("Bulk delete error:", error);
        return { message: "Failed to delete leads" };
    }
}

// ─── Recycle Bin ─────────────────────────────────────────────────────────────

export async function restoreLead(id: string) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        await Lead.findByIdAndUpdate(id, { deletedAt: null });
        logAudit(AUDIT_ACTIONS.RESTORE, ENTITY_TYPES.LEAD, id, "Lead restored from recycle bin");
        revalidatePath("/leads");
        return { message: "Lead restored", success: true };
    } catch (error) {
        console.error("Restore error:", error);
        return { message: "Failed to restore lead" };
    }
}

export async function permanentDeleteLead(id: string) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        await Lead.findByIdAndDelete(id);
        await LeadNote.deleteMany({ leadId: id });
        await LeadAction.deleteMany({ leadId: id });
        logAudit(AUDIT_ACTIONS.DELETE, ENTITY_TYPES.LEAD, id, "Lead permanently deleted");
        revalidatePath("/leads");
        return { message: "Lead permanently deleted", success: true };
    } catch (error) {
        console.error("Permanent delete error:", error);
        return { message: "Failed to permanently delete lead" };
    }
}
