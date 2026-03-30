/**
 * @module lib/actions/calendar
 * @description Server actions for calendar follow-up views.
 *
 * Exports:
 * - `getFollowUpEvents` — get follow-ups for a month
 * - `rescheduleFollowUp` — drag-drop reschedule
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { USER_ROLES } from "@/models/User";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export async function getFollowUpEvents(month: number, year: number) {
    const session = await auth();
    if (!session) return [];

    try {
        await dbConnect();
        const orgId = new mongoose.Types.ObjectId(session.user.orgId as string);
        const isSales = session.user.role === USER_ROLES.SALES;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const query: any = {
            orgId,
            deletedAt: null,
            followUpDate: { $gte: startDate, $lte: endDate },
        };

        if (isSales) {
            query.assignedTo = new mongoose.Types.ObjectId(session.user.id);
        }

        const leads = await Lead.find(query)
            .select("name status followUpDate assignedTo isFromAdditional serialNumber")
            .populate("assignedTo", "name")
            .sort({ followUpDate: 1 })
            .lean();

        const now = new Date();
        return JSON.parse(JSON.stringify(
            leads.map((l: any) => ({
                _id: l._id.toString(),
                leadName: l.name,
                serialNumber: l.serialNumber,
                status: l.status,
                followUpDate: l.followUpDate,
                assignedTo: l.assignedTo?.name || "Unassigned",
                assignedToId: l.assignedTo?._id?.toString(),
                isFromAdditional: l.isFromAdditional || false,
                isOverdue: new Date(l.followUpDate) < now,
                isToday: new Date(l.followUpDate).toDateString() === now.toDateString(),
            }))
        ));
    } catch (error) {
        console.error("getFollowUpEvents error:", error);
        return [];
    }
}

export async function rescheduleFollowUp(leadId: string, newDate: string) {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await dbConnect();
        const orgId = session.user.orgId;

        const lead = await Lead.findOne({
            _id: leadId,
            orgId,
            deletedAt: null,
        });

        if (!lead) return { success: false, message: "Lead not found" };

        // Sales can only edit own leads
        if (session.user.role === USER_ROLES.SALES &&
            lead.assignedTo?.toString() !== session.user.id) {
            return { success: false, message: "Cannot reschedule other's leads" };
        }

        lead.followUpDate = new Date(newDate);
        lead.updatedBy = new mongoose.Types.ObjectId(session.user.id);
        await lead.save();

        revalidatePath("/calendar");
        revalidatePath("/leads");
        return { success: true, message: "Follow-up rescheduled" };
    } catch (error) {
        console.error("rescheduleFollowUp error:", error);
        return { success: false, message: "Failed to reschedule" };
    }
}
