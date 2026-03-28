/**
 * @module lib/actions/additionalLeads
 * @description Server actions for user-owned Additional Leads.
 *
 * Exports:
 * - `getAdditionalLeads` — list with owner/admin-scoped filtering
 * - `getAdditionalLeadStats` — counts by submission status
 * - `createAdditionalLead` — any user creates their own lead
 * - `updateAdditionalLead` — owner can edit draft/rejected leads
 * - `deleteAdditionalLead` — owner soft-deletes
 * - `submitAdditionalLead` — user submits for admin review
 * - `reviewAdditionalLead` — admin accepts/rejects with notes
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import AdditionalLead from "@/models/AdditionalLead";
import Lead from "@/models/Lead";
import { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { serialize } from "@/lib/serialize";
import { createNotification, getAdminUserIds } from "@/lib/actions/notifications";

// ─── Get Additional Leads ────────────────────────────────────────────────────
export async function getAdditionalLeads(filters?: {
    ownerId?: string;
    submissionStatus?: string;
    page?: number;
}) {
    const session = await auth();
    if (!session) return { leads: [], total: 0 };

    await dbConnect();
    const orgId = session.user.orgId;
    const isAdmin = session.user.role === USER_ROLES.ADMIN || !!(session.user as any).isSuperAdmin;
    const page = filters?.page || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const query: any = { orgId, deletedAt: null };

    // Non-admin users can only see their own leads
    if (!isAdmin) {
        query.ownerId = session.user.id;
    } else if (filters?.ownerId && filters.ownerId !== "all") {
        query.ownerId = filters.ownerId;
    }

    if (filters?.submissionStatus && filters.submissionStatus !== "all") {
        query.submissionStatus = filters.submissionStatus;
    }

    const [leads, total] = await Promise.all([
        AdditionalLead.find(query)
            .populate("ownerId", "name username")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AdditionalLead.countDocuments(query),
    ]);

    return {
        leads: serialize(leads),
        total,
    };
}

// ─── Get Stats ───────────────────────────────────────────────────────────────
export async function getAdditionalLeadStats() {
    const session = await auth();
    if (!session) return { draft: 0, pending: 0, approved: 0, rejected: 0, total: 0 };

    await dbConnect();
    const orgId = session.user.orgId;
    const isAdmin = session.user.role === USER_ROLES.ADMIN || !!(session.user as any).isSuperAdmin;

    const match: any = { orgId: new mongoose.Types.ObjectId(orgId as string), deletedAt: null };
    if (!isAdmin) {
        match.ownerId = new mongoose.Types.ObjectId(session.user.id);
    }

    const pipeline = [
        { $match: match },
        { $group: { _id: "$submissionStatus", count: { $sum: 1 } } },
    ];

    const results = await AdditionalLead.aggregate(pipeline);
    const stats: Record<string, number> = { draft: 0, pending: 0, approved: 0, rejected: 0 };
    results.forEach((r: any) => { stats[r._id] = r.count; });

    return {
        draft: stats.draft,
        pending: stats.pending,
        approved: stats.approved,
        rejected: stats.rejected,
        total: stats.draft + stats.pending + stats.approved + stats.rejected,
    };
}

// ─── Create Additional Lead ──────────────────────────────────────────────────
export async function createAdditionalLead(data: {
    name: string;
    phone?: string;
    email?: string;
    countryCode?: string;
    status: string;
    source?: string;
    product?: string;
    value?: number;
    currency?: string;
    description?: string;
}) {
    const session = await auth();
    if (!session) return { message: "Unauthorized", success: false };

    try {
        await dbConnect();
        const orgId = session.user.orgId;

        const lead = await AdditionalLead.create({
            orgId,
            ownerId: session.user.id,
            name: data.name,
            phone: data.phone,
            email: data.email,
            countryCode: data.countryCode || "971",
            status: data.status,
            source: data.source,
            product: data.product,
            value: data.value,
            currency: data.currency || "AED",
            description: data.description,
            submissionStatus: "draft",
        });

        // Notify admins that a user added a new additional lead
        getAdminUserIds().then((adminIds) => {
            createNotification({
                userIds: adminIds.filter(uid => uid !== session.user.id),
                type: "new_lead",
                title: "New Additional Lead",
                message: `${session.user.name} added a new additional lead: "${data.name}"`,
                leadId: lead._id.toString(),
            });
        }).catch(console.error);

        revalidatePath("/additional-leads");
        return { message: "Lead created successfully", success: true, id: lead._id.toString() };
    } catch (error) {
        console.error("Create additional lead error:", error);
        return { message: "Failed to create lead", success: false };
    }
}

// ─── Update Additional Lead ──────────────────────────────────────────────────
export async function updateAdditionalLead(id: string, data: Record<string, any>) {
    const session = await auth();
    if (!session) return { message: "Unauthorized", success: false };

    try {
        await dbConnect();
        const lead = await AdditionalLead.findOne({
            _id: id,
            orgId: session.user.orgId,
        });

        if (!lead) return { message: "Lead not found", success: false };

        // Only owner can edit (if draft or rejected), admin can always edit
        const isAdmin = session.user.role === USER_ROLES.ADMIN;
        const isOwner = lead.ownerId.toString() === session.user.id;

        if (!isAdmin && !isOwner) {
            return { message: "Unauthorized", success: false };
        }

        if (!isAdmin && lead.submissionStatus === "pending") {
            return { message: "Cannot edit while pending review", success: false };
        }

        if (!isAdmin && lead.submissionStatus === "approved") {
            return { message: "Cannot edit approved lead", success: false };
        }

        // Update allowed fields
        const allowedFields = ["name", "phone", "email", "countryCode", "status", "source", "product", "value", "currency", "description"];
        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                (lead as any)[field] = data[field];
            }
        });

        await lead.save();
        revalidatePath("/additional-leads");
        return { message: "Lead updated", success: true };
    } catch (error) {
        console.error("Update additional lead error:", error);
        return { message: "Failed to update lead", success: false };
    }
}

// ─── Delete Additional Lead ──────────────────────────────────────────────────
export async function deleteAdditionalLead(id: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized", success: false };

    try {
        await dbConnect();
        const lead = await AdditionalLead.findOne({
            _id: id,
            orgId: session.user.orgId,
        });

        if (!lead) return { message: "Lead not found", success: false };

        const isAdmin = session.user.role === USER_ROLES.ADMIN;
        const isOwner = lead.ownerId.toString() === session.user.id;

        if (!isAdmin && !isOwner) {
            return { message: "Unauthorized", success: false };
        }

        lead.deletedAt = new Date();
        await lead.save();

        revalidatePath("/additional-leads");
        return { message: "Lead deleted", success: true };
    } catch (error) {
        console.error("Delete additional lead error:", error);
        return { message: "Failed to delete lead", success: false };
    }
}

// ─── Submit for Review ───────────────────────────────────────────────────────
export async function submitAdditionalLead(id: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized", success: false };

    try {
        await dbConnect();
        const lead = await AdditionalLead.findOne({
            _id: id,
            orgId: session.user.orgId,
            ownerId: session.user.id,
        });

        if (!lead) return { message: "Lead not found", success: false };
        if (lead.submissionStatus === "pending") return { message: "Already pending review", success: false };
        if (lead.submissionStatus === "approved") return { message: "Already approved", success: false };

        lead.submissionStatus = "pending";
        lead.submittedAt = new Date();
        await lead.save();

        // Notify admins
        getAdminUserIds().then((adminIds) => {
            createNotification({
                userIds: adminIds,
                type: "new_lead",
                title: "Lead Submitted for Review",
                message: `${session.user.name} submitted "${lead.name}" for approval.`,
                leadId: lead._id.toString(),
            });
        }).catch(console.error);

        revalidatePath("/additional-leads");
        return { message: "Lead submitted for review", success: true };
    } catch (error) {
        console.error("Submit additional lead error:", error);
        return { message: "Failed to submit lead", success: false };
    }
}

// ─── Admin Review (Accept/Reject) ────────────────────────────────────────────
export async function reviewAdditionalLead(
    id: string,
    action: "approve" | "reject",
    notes?: string
) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Only admins can review", success: false };
    }

    try {
        await dbConnect();
        const additionalLead = await AdditionalLead.findOne({
            _id: id,
            orgId: session.user.orgId,
        });

        if (!additionalLead) return { message: "Lead not found", success: false };

        additionalLead.reviewedAt = new Date();
        additionalLead.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
        if (notes) additionalLead.reviewNotes = notes;

        if (action === "approve") {
            // Create a real Lead from additional lead data
            const realLead = await Lead.create({
                orgId: additionalLead.orgId,
                name: additionalLead.name,
                phone: additionalLead.phone,
                email: additionalLead.email,
                countryCode: additionalLead.countryCode,
                status: additionalLead.status,
                source: additionalLead.source,
                product: additionalLead.product,
                value: additionalLead.value,
                currency: additionalLead.currency,
                description: additionalLead.description,
                createdBy: additionalLead.ownerId,
                assignedTo: additionalLead.ownerId, // Assign to the creator
            });

            additionalLead.submissionStatus = "approved";
            additionalLead.convertedLeadId = realLead._id;
            await additionalLead.save();

            // Notify the owner
            createNotification({
                userIds: [additionalLead.ownerId.toString()],
                type: "lead_updated",
                title: "Lead Approved ✅",
                message: `Your lead "${additionalLead.name}" was approved and added to the system.`,
                leadId: realLead._id.toString(),
            }).catch(console.error);
        } else {
            additionalLead.submissionStatus = "rejected";
            await additionalLead.save();

            // Notify the owner
            createNotification({
                userIds: [additionalLead.ownerId.toString()],
                type: "lead_updated",
                title: "Lead Rejected ❌",
                message: `Your lead "${additionalLead.name}" was rejected.${notes ? ` Reason: ${notes}` : ""}`,
                leadId: additionalLead._id.toString(),
            }).catch(console.error);
        }

        revalidatePath("/additional-leads");
        revalidatePath("/leads");
        return {
            message: action === "approve" ? "Lead approved and added to system" : "Lead rejected",
            success: true,
        };
    } catch (error) {
        console.error("Review additional lead error:", error);
        return { message: "Failed to review lead", success: false };
    }
}
