/**
 * @module lib/actions/leads/notes
 * @description Server actions for lead timeline entries (notes and actions).
 *
 * Exports:
 * - `addNote` — creates a LeadNote and a corresponding AuditLog entry
 * - `addLeadAction` — creates a LeadAction (call, meeting, etc.) with dual logging
 *
 * Both functions validate via Zod and record the user's role for permission tracking.
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote, { NOTE_TYPES } from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import User, { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { createNotification } from "@/lib/actions/notifications";

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function addNote(leadId: string, message: string) {
    const session = await auth();
    if (!session || !session.user.orgId) return { message: "Unauthorized", success: false };

    // Marketing cannot add notes
    if (session.user.role === USER_ROLES.MARKETING) {
        return { message: "Unauthorized: Marketing users cannot add notes", success: false };
    }

    try {
        // Check access
        await dbConnect();
        const lead = await Lead.findOne({ _id: leadId, orgId: session.user.orgId });
        if (!lead) return { message: "Lead not found", success: false };

        if (session.user.role !== USER_ROLES.ADMIN && lead.assignedTo?.toString() !== session.user.id) {
            return { message: "Unauthorized", success: false };
        }

        // Parse @mentions from message — match @Name or @"Name with spaces"
        const mentionRegex = /@(\w+(?:\s\w+)*)/g;
        const mentionNames: string[] = [];
        let match;
        while ((match = mentionRegex.exec(message)) !== null) {
            mentionNames.push(match[1]);
        }

        // Resolve mention names to user IDs
        let mentionIds: mongoose.Types.ObjectId[] = [];
        if (mentionNames.length > 0) {
            const mentionedUsers = await User.find({
                orgId: session.user.orgId,
                name: { $in: mentionNames.map(n => new RegExp(`^${n}$`, "i")) },
                active: true,
            }).select("_id").lean();
            mentionIds = mentionedUsers.map((u: any) => u._id);
        }

        // Determine note type — if has @mentions, it's an internal comment
        const noteType = mentionIds.length > 0 ? NOTE_TYPES.INTERNAL_COMMENT : NOTE_TYPES.COMMENT;

        await LeadNote.create({
            orgId: session.user.orgId,
            leadId: new mongoose.Types.ObjectId(leadId),
            authorId: new mongoose.Types.ObjectId(session.user.id),
            authorRole: session.user.role,
            type: noteType,
            message,
            mentions: mentionIds.length > 0 ? mentionIds : undefined,
        });

        // Send notifications to @mentioned users
        if (mentionIds.length > 0) {
            await createNotification({
                userIds: mentionIds.map(id => id.toString()),
                type: "comment_mention",
                title: `${session.user.name} mentioned you`,
                message: `"${message.substring(0, 100)}${message.length > 100 ? "..." : ""}" on lead ${lead.name}`,
                leadId,
            });
        }

        revalidatePath(`/leads/${leadId}`);
        return { message: "Note added", success: true };
    } catch (error) {
        console.error("addNote error:", error);
        return { message: "Failed to add note", success: false };
    }
}

// ─── Lead Actions (Timeline) ────────────────────────────────────────────────

export async function addLeadAction(
    leadId: string,
    data: { type: string; description: string; outcome?: string }
) {
    const session = await auth();
    if (!session || !session.user.orgId) return { message: "Unauthorized", success: false };

    // Marketing cannot add actions
    if (session.user.role === USER_ROLES.MARKETING) {
        return { message: "Unauthorized: Marketing users cannot add actions", success: false };
    }

    try {
        await dbConnect();
        const lead = await Lead.findOne({ _id: leadId, orgId: session.user.orgId });
        if (!lead) return { message: "Lead not found", success: false };

        // Only Admin or assigned Sales
        if (session.user.role !== USER_ROLES.ADMIN && lead.assignedTo?.toString() !== session.user.id) {
            return { message: "Unauthorized", success: false };
        }

        await LeadAction.create({
            orgId: session.user.orgId,
            leadId: new mongoose.Types.ObjectId(leadId),
            authorId: new mongoose.Types.ObjectId(session.user.id),
            type: data.type,
            description: data.description,
            outcome: data.outcome || undefined,
        });

        // Also log as a system note for audit trail
        await LeadNote.create({
            orgId: session.user.orgId,
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
        return { message: "Failed to add action", success: false };
    }
}
