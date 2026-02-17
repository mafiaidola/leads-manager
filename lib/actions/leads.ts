"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote, { NOTE_TYPES } from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import mongoose from "mongoose";
import { logAudit } from "@/lib/actions/audit";
import { AUDIT_ACTIONS, ENTITY_TYPES } from "@/models/AuditLog";


const LeadSchema = z.object({
    name: z.string().min(1),
    company: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    status: z.string(),
    source: z.string().optional(),
    product: z.string().optional(),
    assignedTo: z.string().optional(),
    value: z.coerce.number().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    position: z.string().optional(),
    defaultLanguage: z.string().optional(),
    description: z.string().optional(),
    tags: z.string().optional(), // Comma separated
    public: z.string().optional(), // Checkbox
    contactedToday: z.string().optional(), // Checkbox
});

// ─── Real-time duplicate phone check ────────────────────────────────────────
export async function checkDuplicatePhone(phone: string) {
    const session = await auth();
    if (!session) return { exists: false };

    if (!phone || phone.trim().length < 4) return { exists: false };

    try {
        await dbConnect();
        const existingLead = await Lead.findOne({ phone: phone.trim() })
            .select("name phone")
            .lean();

        if (existingLead) {
            return {
                exists: true,
                leadName: existingLead.name,
                leadId: existingLead._id.toString(),
            };
        }
        return { exists: false };
    } catch {
        return { exists: false };
    }
}

// ─── Duplicate lead check (email + phone) ───────────────────────────────────
export async function checkDuplicateLead(email?: string, phone?: string, excludeId?: string) {
    const session = await auth();
    if (!session) return { duplicates: [] };

    try {
        await dbConnect();
        const orConditions: any[] = [];
        if (email && email.trim()) orConditions.push({ email: email.trim() });
        if (phone && phone.trim().length >= 4) orConditions.push({ phone: phone.trim() });
        if (orConditions.length === 0) return { duplicates: [] };

        const query: any = { $or: orConditions, deletedAt: null };
        if (excludeId) query._id = { $ne: excludeId };

        const matches = await Lead.find(query)
            .select("name email phone company status")
            .limit(5)
            .lean();

        return {
            duplicates: matches.map((m) => ({
                _id: m._id.toString(),
                name: m.name,
                email: m.email,
                phone: m.phone,
                company: m.company,
                status: m.status,
            })),
        };
    } catch {
        return { duplicates: [] };
    }
}

// ─── Kanban: Get leads grouped by status ────────────────────────────────────
export async function getLeadsByStatus() {
    const session = await auth();
    if (!session) return {};

    await dbConnect();

    const query: any = { deletedAt: null };
    if (session.user.role === USER_ROLES.SALES) {
        query.assignedTo = session.user.id;
    }

    const leads = await Lead.find(query)
        .sort({ createdAt: -1 })
        .populate("assignedTo", "name")
        .lean();

    const grouped: Record<string, any[]> = {};
    for (const lead of leads) {
        const status = lead.status || "interesting";
        if (!grouped[status]) grouped[status] = [];
        grouped[status].push({
            _id: lead._id.toString(),
            name: lead.name,
            company: lead.company,
            email: lead.email,
            phone: lead.phone,
            value: lead.value,
            source: lead.source,
            starred: (lead.starred || []).map((s: any) => s.toString()),
            assignedTo: lead.assignedTo
                ? { _id: (lead.assignedTo as any)._id?.toString(), name: (lead.assignedTo as any).name }
                : null,
            createdAt: (lead.createdAt as Date).toISOString(),
        });
    }
    return grouped;
}

// ─── Activity Timeline (merged notes + actions) ─────────────────────────────
export async function getLeadTimeline(leadId: string) {
    const session = await auth();
    if (!session) return [];

    await dbConnect();

    const [notes, actions] = await Promise.all([
        LeadNote.find({ leadId })
            .populate("authorId", "name")
            .sort({ createdAt: -1 })
            .lean(),
        LeadAction.find({ leadId })
            .populate("authorId", "name")
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    const timeline: any[] = [];

    for (const note of notes) {
        timeline.push({
            _id: note._id.toString(),
            kind: "note",
            type: note.type,
            message: note.message,
            authorName: (note.authorId as any)?.name || note.authorRole || "System",
            createdAt: (note.createdAt as Date).toISOString(),
        });
    }

    for (const action of actions) {
        timeline.push({
            _id: action._id.toString(),
            kind: "action",
            type: action.type,
            description: action.description,
            outcome: action.outcome,
            authorName: (action.authorId as any)?.name || "Unknown",
            createdAt: (action.createdAt as Date).toISOString(),
        });
    }

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return timeline;
}

export async function updateLead(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

    const rawFormData = Object.fromEntries(formData.entries());
    const id = rawFormData.id as string;

    // Validate
    const validatedFields = LeadSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
        return { message: "Invalid fields", errors: validatedFields.error.flatten() };
    }

    const { tags, assignedTo, ...rest } = validatedFields.data;
    const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

    try {
        await dbConnect();
        const lead = await Lead.findById(id);
        if (!lead) return { message: "Lead not found" };

        // RBAC: Admin or assigned Sales can update. Marketing cannot edit.
        if (session.user.role === USER_ROLES.MARKETING) {
            return { message: "Unauthorized: Marketing users cannot edit leads" };
        }
        if (session.user.role === USER_ROLES.SALES && lead.assignedTo?.toString() !== session.user.id) {
            return { message: "Unauthorized" };
        }

        // Update fields
        lead.name = rest.name;
        lead.company = rest.company;
        lead.email = rest.email;
        lead.phone = rest.phone;
        lead.status = rest.status;
        lead.source = rest.source;
        lead.product = rest.product;

        // Sales users cannot change assignment
        if (session.user.role === USER_ROLES.ADMIN) {
            lead.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined;
        }
        // For Sales, assignedTo stays unchanged

        lead.value = rest.value;
        lead.website = rest.website;
        lead.address = {
            addressLine: rest.address,
            city: rest.city,
            state: rest.state,
            country: rest.country || "UAE",
            zipCode: rest.zipCode
        };
        lead.defaultLanguage = rest.defaultLanguage || "System Default";
        lead.position = rest.position;
        lead.description = rest.description;
        lead.tags = tagList;
        lead.public = rawFormData.public === "on";
        lead.contactedToday = rawFormData.contactedToday === "on";
        lead.updatedBy = new mongoose.Types.ObjectId(session.user.id);

        await lead.save();

        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.LEAD, id, `Updated lead: ${lead.name}`);

        revalidatePath("/leads");
        revalidatePath(`/leads/${id}`);
        return { message: "Lead updated successfully", success: true };

    } catch (error) {
        console.error("Update Error:", error);
        return { message: "Failed to update lead" };
    }
}

export async function createLead(prevState: any, formData: FormData) {
    const session = await auth();
    // Allow ADMIN and MARKETING to create leads
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== USER_ROLES.MARKETING)) {
        return { message: "Unauthorized" };
    }

    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = LeadSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        return { message: "Invalid fields", errors: validatedFields.error.flatten() };
    }

    const { tags, assignedTo, ...rest } = validatedFields.data;
    const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

    // Duplication Check
    if (rest.phone) {
        await dbConnect();
        const existingLead = await Lead.findOne({ phone: rest.phone });
        if (existingLead) {
            return { message: `Lead with this phone number already exists (${existingLead.name}).`, duplicate: true };
        }
    }

    try {
        await dbConnect();
        const newLead = await Lead.create({
            ...rest,
            assignedTo: assignedTo || undefined,
            address: {
                addressLine: rest.address,
                city: rest.city,
                state: rest.state,
                country: rest.country || "UAE",
                zipCode: rest.zipCode
            },
            website: rest.website,
            description: rest.description,
            product: rest.product,
            tags: tagList,
            createdBy: new mongoose.Types.ObjectId(session.user.id),
            updatedBy: new mongoose.Types.ObjectId(session.user.id),
            contactedToday: rawFormData.contactedToday === "on",
            public: rawFormData.public === "on",
            defaultLanguage: rest.defaultLanguage || "System Default",
            position: rest.position,
        });

        // Create SYSTEM note
        await LeadNote.create({
            leadId: newLead._id,
            type: NOTE_TYPES.SYSTEM,
            message: "Lead created",
            authorRole: "SYSTEM",
            createdAt: new Date(),
        });

        // If assigned, create assignment note
        if (assignedTo) {
            await LeadNote.create({
                leadId: newLead._id,
                authorId: new mongoose.Types.ObjectId(session.user.id),
                authorRole: session.user.role,
                type: NOTE_TYPES.SYSTEM,
                message: `Lead assigned by ${session.user.name}`,
            });
        }

        logAudit(AUDIT_ACTIONS.CREATE, ENTITY_TYPES.LEAD, newLead._id.toString(), `Created lead: ${rest.name}`);

    } catch (error) {
        console.error("Failed to create lead:", error);
        return { message: "Database Error: Failed to create lead." };
    }

    revalidatePath("/leads");
    redirect("/leads");
}

export async function updateLeadStatus(id: string, newStatus: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

    // Marketing cannot change status
    if (session.user.role === USER_ROLES.MARKETING) {
        return { message: "Unauthorized: Marketing users cannot change lead status" };
    }

    try {
        await dbConnect();
        const lead = await Lead.findById(id);
        if (!lead) return { message: "Lead not found" };

        if (session.user.role !== USER_ROLES.ADMIN && lead.assignedTo?.toString() !== session.user.id) {
            return { message: "Unauthorized: Not assigned to you" };
        }

        const oldStatus = lead.status;
        lead.status = newStatus;
        lead.updatedBy = new mongoose.Types.ObjectId(session.user.id);
        await lead.save();

        await LeadNote.create({
            leadId: new mongoose.Types.ObjectId(id),
            authorId: new mongoose.Types.ObjectId(session.user.id),
            authorRole: session.user.role,
            type: NOTE_TYPES.STATUS_CHANGE,
            message: `Status changed from ${oldStatus} to ${newStatus}`,
            meta: { fromStatus: oldStatus, toStatus: newStatus },
        });

        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.LEAD, id, `Status changed from ${oldStatus} to ${newStatus}`);

        revalidatePath(`/leads/${id}`);
        revalidatePath("/leads");
        return { message: "Status updated", success: true };
    } catch (error) {
        return { message: "Error updating status" };
    }
}

export async function getLeads(searchParams: any) {
    const session = await auth();
    if (!session) return { leads: [], total: 0 };

    await dbConnect();

    // Build query
    const query: any = {};

    // Exclude soft-deleted leads by default
    if (searchParams.trash === "true") {
        query.deletedAt = { $ne: null };
    } else {
        query.deletedAt = null;
    }

    // RBAC: Sales sees only assigned. Marketing sees all. Admin sees all.
    if (session.user.role === USER_ROLES.SALES) {
        query.assignedTo = session.user.id;
    } else if (searchParams.assignedTo) {
        query.assignedTo = searchParams.assignedTo;
    }

    if (searchParams.status) query.status = searchParams.status;
    if (searchParams.source) query.source = searchParams.source;

    if (searchParams.search) {
        query.$text = { $search: searchParams.search };
    }

    if (searchParams.tag) {
        query.tags = searchParams.tag;
    }

    // Starred filter
    if (searchParams.starred === "true") {
        query.starred = new mongoose.Types.ObjectId(session.user.id);
    }

    const page = Number(searchParams.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const leads = await Lead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("assignedTo", "name")
        .lean();

    const total = await Lead.countDocuments(query);

    // Serialization
    return {
        leads: leads.map(l => ({
            ...l,
            _id: l._id.toString(),
            starred: (l.starred || []).map((s: any) => s.toString()),
            assignedTo: l.assignedTo ? {
                ...l.assignedTo,
                _id: (l.assignedTo as any)._id?.toString()
            } : null,
            customFields: l.customFields || {},
            deletedAt: l.deletedAt ? (l.deletedAt as Date).toISOString() : null,
            createdAt: (l.createdAt as Date).toISOString(),
            updatedAt: (l.updatedAt as Date).toISOString(),
        })),
        total
    };
}

export async function getLeadsStats() {
    const session = await auth();
    if (!session) return [];

    await dbConnect();

    const query: any = { deletedAt: null };
    // Sales sees only own stats. Marketing + Admin see all.
    if (session.user.role === USER_ROLES.SALES) {
        query.assignedTo = session.user.id;
    }

    const stats = await Lead.aggregate([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    return stats.map(s => ({ status: s._id, count: s.count }));
}

export async function getLeadDetails(id: string) {
    const session = await auth();
    if (!session) return null;

    await dbConnect();
    const lead = await Lead.findById(id).populate("assignedTo", "name").lean();
    if (!lead) return null;

    // RBAC: Admin sees all, Marketing sees all (read-only), Sales sees only assigned
    if (session.user.role === USER_ROLES.SALES && lead.assignedTo?.toString() !== session.user.id) {
        return null;
    }

    const notes = await LeadNote.find({ leadId: id })
        .sort({ createdAt: -1 })
        .populate("authorId", "name")
        .lean();

    const actions = await LeadAction.find({ leadId: id })
        .sort({ createdAt: -1 })
        .populate("authorId", "name")
        .lean();

    return {
        lead: {
            ...lead,
            _id: lead._id.toString(),
            assignedTo: lead.assignedTo ? { ...lead.assignedTo, _id: lead.assignedTo._id.toString() } : null,
            createdBy: lead.createdBy.toString(),
            updatedBy: lead.updatedBy?.toString(),
            createdAt: lead.createdAt.toISOString(),
            updatedAt: lead.updatedAt.toISOString(),
            lastContactAt: lead.lastContactAt?.toISOString(),
        },
        notes: notes.map(n => ({
            ...n,
            _id: n._id.toString(),
            authorId: n.authorId ? { ...n.authorId, _id: n.authorId._id.toString() } : null,
            createdAt: n.createdAt.toISOString(),
        })),
        actions: actions.map(a => ({
            ...a,
            _id: a._id.toString(),
            leadId: a.leadId.toString(),
            authorId: a.authorId ? { ...a.authorId, _id: a.authorId._id.toString() } : null,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
            scheduledAt: a.scheduledAt?.toISOString(),
            completedAt: a.completedAt?.toISOString(),
        })),
    };
}

export async function addNote(leadId: string, message: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

    // Marketing cannot add notes
    if (session.user.role === USER_ROLES.MARKETING) {
        return { message: "Unauthorized: Marketing users cannot add notes" };
    }

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
    return { message: "Note added" };
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
}


export async function deleteLead(id: string) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        // Soft delete — move to recycle bin
        const lead = await Lead.findByIdAndUpdate(id, { deletedAt: new Date() });
        if (!lead) return { message: "Lead not found" };

        logAudit(AUDIT_ACTIONS.DELETE, ENTITY_TYPES.LEAD, id, `Soft deleted lead: ${lead.name}`);

        revalidatePath("/leads");
        return { message: "Lead moved to recycle bin", success: true };
    } catch (error) {
        console.error("Delete Lead Error:", error);
        return { message: "Failed to delete lead" };
    }
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkUpdateStatus(ids: string[], status: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

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

    try {
        await dbConnect();
        await Lead.updateMany(
            { _id: { $in: ids } },
            { assignedTo: new mongoose.Types.ObjectId(assignToId), updatedBy: new mongoose.Types.ObjectId(session.user.id) }
        );
        logAudit(AUDIT_ACTIONS.BULK_UPDATE, ENTITY_TYPES.LEAD, ids.join(","), `Bulk assigned ${ids.length} leads to user ${assignToId}`);

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

// ─── Star / Favorite ─────────────────────────────────────────────────────────

export async function toggleStarLead(leadId: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

    try {
        await dbConnect();
        const userId = new mongoose.Types.ObjectId(session.user.id);
        const lead = await Lead.findById(leadId);
        if (!lead) return { message: "Lead not found" };

        const isStarred = lead.starred.some((s: any) => s.toString() === session.user.id);
        if (isStarred) {
            lead.starred = lead.starred.filter((s: any) => s.toString() !== session.user.id);
        } else {
            lead.starred.push(userId);
        }
        await lead.save();
        revalidatePath("/leads");
        return { message: isStarred ? "Unstarred" : "Starred", success: true, starred: !isStarred };
    } catch (error) {
        console.error("Toggle star error:", error);
        return { message: "Failed to toggle star" };
    }
}

// ─── Lead Transfer ───────────────────────────────────────────────────────────

export async function transferLead(leadId: string, toUserId: string) {
    const session = await auth();
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== USER_ROLES.MARKETING)) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        const lead = await Lead.findById(leadId);
        if (!lead) return { message: "Lead not found" };

        const previousAssignedTo = lead.assignedTo?.toString() || "Unassigned";
        lead.assignedTo = new mongoose.Types.ObjectId(toUserId);
        lead.updatedBy = new mongoose.Types.ObjectId(session.user.id);
        await lead.save();

        // Log transfer as a system note
        await LeadNote.create({
            leadId,
            authorId: new mongoose.Types.ObjectId(session.user.id),
            authorRole: "SYSTEM",
            message: `Lead transferred from ${previousAssignedTo} to ${toUserId}`,
            type: NOTE_TYPES.SYSTEM,
        });

        logAudit(AUDIT_ACTIONS.TRANSFER, ENTITY_TYPES.LEAD, leadId, `Transferred lead from ${previousAssignedTo} to ${toUserId}`);

        revalidatePath("/leads");
        return { message: "Lead transferred successfully", success: true };
    } catch (error) {
        console.error("Transfer error:", error);
        return { message: "Failed to transfer lead" };
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

