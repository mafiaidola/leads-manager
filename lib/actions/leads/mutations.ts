"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote, { NOTE_TYPES } from "@/models/LeadNote";
import { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import mongoose from "mongoose";
import { logAudit } from "@/lib/actions/audit";
import { AUDIT_ACTIONS, ENTITY_TYPES } from "@/models/AuditLog";
import { createNotification, getAdminUserIds } from "@/lib/actions/notifications";

const LeadSchema = z.object({
    name: z.string().min(1),
    company: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().regex(/^\d*$/, "Phone number must contain only digits").optional(),
    countryCode: z.string().optional(),
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
    followUpDate: z.string().optional(), // ISO date string
});

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
        const sanitizedPhone = rest.phone.replace(/[^0-9]/g, "");
        rest.phone = sanitizedPhone; // Store sanitized
        await dbConnect();
        const existingLead = await Lead.findOne({ phone: sanitizedPhone, deletedAt: null });
        if (existingLead) {
            return { message: `Lead with this phone number already exists (${existingLead.name}).`, duplicate: true };
        }
    }

    try {
        await dbConnect();
        const newLead = await Lead.create({
            ...rest,
            countryCode: rest.countryCode || "971",
            followUpDate: rest.followUpDate ? new Date(rest.followUpDate) : undefined,
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

        // Notify all admins about the new lead
        getAdminUserIds().then((adminIds) => {
            const targets = [...new Set([...adminIds, ...(assignedTo ? [assignedTo] : [])])];
            createNotification({
                userIds: targets,
                type: "new_lead",
                title: "New Lead Created",
                message: `${session.user.name} created a new lead: "${rest.name}"${rest.phone ? ` (${rest.phone})` : ""}.`,
                leadId: newLead._id.toString(),
            });
        }).catch(console.error);

    } catch (error) {
        console.error("Failed to create lead:", error);
        return { message: "Database Error: Failed to create lead." };
    }

    revalidatePath("/leads");
    redirect("/leads");
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

        // Duplicate phone check (server-side guard)
        if (rest.phone) {
            const sanitizedPhone = rest.phone.replace(/[^0-9]/g, "");
            rest.phone = sanitizedPhone;
            const existingLead = await Lead.findOne({ phone: sanitizedPhone, deletedAt: null, _id: { $ne: id } });
            if (existingLead) {
                return { message: `Phone number already belongs to "${existingLead.name}". Duplicates not allowed.`, duplicate: true };
            }
        }

        // Build structured change diff for audit
        const changes: string[] = [];
        const trackField = (label: string, oldVal: any, newVal: any) => {
            const o = String(oldVal ?? "").trim();
            const n = String(newVal ?? "").trim();
            if (o !== n) changes.push(`${label}: ${o || "(empty)"} → ${n || "(empty)"}`);
        };
        trackField("Name", lead.name, rest.name);
        trackField("Company", lead.company, rest.company);
        trackField("Email", lead.email, rest.email);
        trackField("Phone", lead.phone, rest.phone);
        trackField("Status", lead.status, rest.status);
        trackField("Source", lead.source, rest.source);
        trackField("Product", lead.product, rest.product);
        trackField("Value", lead.value, rest.value);
        trackField("Website", lead.website, rest.website);

        // Update fields
        lead.name = rest.name;
        lead.company = rest.company;
        lead.email = rest.email;
        lead.phone = rest.phone;
        lead.countryCode = rest.countryCode || lead.countryCode || "971";
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
        lead.followUpDate = rest.followUpDate ? new Date(rest.followUpDate) : undefined;
        lead.updatedBy = new mongoose.Types.ObjectId(session.user.id);

        const prevAssignedTo = lead.assignedTo?.toString();
        await lead.save();

        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.LEAD, id, changes.length > 0 ? changes.join(" | ") : `Updated lead: ${lead.name}`);

        // Notify newly assigned user (if assignment changed)
        if (assignedTo && assignedTo !== prevAssignedTo) {
            createNotification({
                userIds: [assignedTo],
                type: "lead_assigned",
                title: "Lead Assigned to You",
                message: `${session.user.name} assigned "${lead.name}" to you.`,
                leadId: id,
            }).catch(console.error);
        }

        revalidatePath("/leads");
        revalidatePath(`/leads/${id}`);
        return { message: "Lead updated successfully", success: true };

    } catch (error) {
        console.error("Update Error:", error);
        return { message: "Failed to update lead" };
    }
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

        // Notify assigned user about status change
        if (lead.assignedTo) {
            createNotification({
                userIds: [lead.assignedTo.toString()],
                type: "status_changed",
                title: "Lead Status Changed",
                message: `"${lead.name}" status changed from ${oldStatus} → ${newStatus}.`,
                leadId: id,
            }).catch(console.error);
        }

        revalidatePath(`/leads/${id}`);
        revalidatePath("/leads");
        return { message: "Status updated", success: true };
    } catch (error) {
        return { message: "Error updating status" };
    }
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
