"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote, { NOTE_TYPES } from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function addNote(leadId: string, message: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

    // Marketing cannot add notes
    if (session.user.role === USER_ROLES.MARKETING) {
        return { message: "Unauthorized: Marketing users cannot add notes" };
    }

    try {
        // Check access
        await dbConnect();
        const lead = await Lead.findById(leadId);
        if (!lead) return { message: "Lead not found" };

        if (session.user.role !== USER_ROLES.ADMIN && lead.assignedTo?.toString() !== session.user.id) {
            return { message: "Unauthorized" };
        }

        await LeadNote.create({
            leadId: new mongoose.Types.ObjectId(leadId),
            authorId: new mongoose.Types.ObjectId(session.user.id),
            authorRole: session.user.role,
            type: NOTE_TYPES.COMMENT,
            message,
        });

        revalidatePath(`/leads/${leadId}`);
        return { message: "Note added", success: true };
    } catch (error) {
        console.error("addNote error:", error);
        return { message: "Failed to add note" };
    }
}

// ─── Lead Actions (Timeline) ────────────────────────────────────────────────

export async function addLeadAction(
    leadId: string,
    data: { type: string; description: string; outcome?: string }
) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

    // Marketing cannot add actions
    if (session.user.role === USER_ROLES.MARKETING) {
        return { message: "Unauthorized: Marketing users cannot add actions" };
    }

    try {
        await dbConnect();
        const lead = await Lead.findById(leadId);
        if (!lead) return { message: "Lead not found" };

        // Only Admin or assigned Sales
        if (session.user.role !== USER_ROLES.ADMIN && lead.assignedTo?.toString() !== session.user.id) {
            return { message: "Unauthorized" };
        }

        await LeadAction.create({
            leadId: new mongoose.Types.ObjectId(leadId),
            authorId: new mongoose.Types.ObjectId(session.user.id),
            type: data.type,
            description: data.description,
            outcome: data.outcome || undefined,
        });

        // Also log as a system note for audit trail
        await LeadNote.create({
            leadId: new mongoose.Types.ObjectId(leadId),
            authorId: new mongoose.Types.ObjectId(session.user.id),
            authorRole: session.user.role,
            type: NOTE_TYPES.SYSTEM,
            message: `Action: ${data.type} - ${data.description}`,
        });

        // Update last contact time
        lead.lastContactAt = new Date();
        lead.contactedToday = true;
        lead.updatedBy = new mongoose.Types.ObjectId(session.user.id);
        await lead.save();

        revalidatePath(`/leads/${leadId}`);
        return { message: "Action added successfully", success: true };
    } catch (error) {
        console.error("addLeadAction error:", error);
        return { message: "Failed to add action" };
    }
}
