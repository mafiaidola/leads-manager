"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import AuditLog from "@/models/AuditLog";
import { USER_ROLES } from "@/models/User";
import mongoose from "mongoose";

// ─── Real-time duplicate phone check ────────────────────────────────────────
export async function checkDuplicatePhone(phone: string, excludeId?: string) {
    const session = await auth();
    if (!session) return { exists: false };

    // Sanitize: digits only
    const sanitized = phone.replace(/[^0-9]/g, "");
    if (!sanitized || sanitized.length < 4) return { exists: false };

    try {
        await dbConnect();
        const query: any = { phone: sanitized, deletedAt: null };
        if (excludeId) query._id = { $ne: excludeId };

        const existingLead = await Lead.findOne(query)
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
        const sanitizedPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
        if (sanitizedPhone.length >= 4) orConditions.push({ phone: sanitizedPhone });
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

    try {
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
                createdAt: lead.createdAt ? (lead.createdAt as Date).toISOString() : new Date().toISOString(),
            });
        }
        return grouped;
    } catch (error) {
        console.error("getLeadsByStatus error:", error);
        return {};
    }
}

// ─── Activity Timeline (merged notes + actions + audit) ─────────────────────
export async function getLeadTimeline(leadId: string) {
    const session = await auth();
    if (!session) return [];

    try {
        await dbConnect();

        const [notes, actions, audits] = await Promise.all([
            LeadNote.find({ leadId })
                .populate("authorId", "name")
                .sort({ createdAt: -1 })
                .lean(),
            LeadAction.find({ leadId })
                .populate("authorId", "name")
                .sort({ createdAt: -1 })
                .lean(),
            AuditLog.find({ entityType: "lead", entityId: leadId })
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
                createdAt: note.createdAt ? (note.createdAt as Date).toISOString() : new Date().toISOString(),
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
                createdAt: action.createdAt ? (action.createdAt as Date).toISOString() : new Date().toISOString(),
            });
        }

        for (const audit of audits) {
            timeline.push({
                _id: audit._id.toString(),
                kind: "audit",
                type: audit.action,
                message: audit.details,
                authorName: audit.userName || "System",
                createdAt: audit.createdAt ? (audit.createdAt as Date).toISOString() : new Date().toISOString(),
            });
        }

        // Sort by date descending
        timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return timeline;
    } catch (error) {
        console.error("getLeadTimeline error:", error);
        return [];
    }
}

// ─── Get leads with pagination, filtering, sorting ──────────────────────────
export async function getLeads(searchParams: any) {
    const session = await auth();
    if (!session) return { leads: [], total: 0 };

    try {
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

        // "Added By" role filter — show leads created by users of a specific role
        if (searchParams.createdByRole) {
            const User = (await import("@/models/User")).default;
            const roleUsers = await User.find({ role: searchParams.createdByRole }).select("_id").lean();
            query.createdBy = { $in: roleUsers.map((u: any) => u._id) };
        }

        // Value range filter
        if (searchParams.minValue || searchParams.maxValue) {
            query.value = {};
            if (searchParams.minValue) query.value.$gte = Number(searchParams.minValue);
            if (searchParams.maxValue) query.value.$lte = Number(searchParams.maxValue);
        }

        // Starred filter
        if (searchParams.starred === "true") {
            query.starred = new mongoose.Types.ObjectId(session.user.id);
        }

        // Overdue follow-up filter
        if (searchParams.overdue === "true") {
            query.followUpDate = { $lte: new Date(), $ne: null };
        }

        const page = Number(searchParams.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        // Dynamic sort — whitelist fields to prevent injection
        const ALLOWED_SORT_FIELDS: Record<string, string> = {
            name: "name",
            value: "value",
            status: "status",
            createdAt: "createdAt",
            followUpDate: "followUpDate",
            serialNumber: "serialNumber",
        };
        const sortField = ALLOWED_SORT_FIELDS[searchParams.sort] || "createdAt";
        const sortDir = searchParams.dir === "asc" ? 1 : -1;
        const sortObj: Record<string, 1 | -1> = { [sortField]: sortDir };

        const leads = await Lead.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate("assignedTo", "name")
            .populate("createdBy", "name")
            .lean();

        const total = await Lead.countDocuments(query);

        // Activity counts per lead
        const leadIds = leads.map(l => l._id);
        const [noteCounts, actionCounts] = await Promise.all([
            LeadNote.aggregate([
                { $match: { leadId: { $in: leadIds } } },
                { $group: { _id: "$leadId", count: { $sum: 1 } } },
            ]),
            LeadAction.aggregate([
                { $match: { leadId: { $in: leadIds } } },
                { $group: { _id: "$leadId", count: { $sum: 1 } } },
            ]),
        ]);
        const noteMap = new Map(noteCounts.map((n: any) => [n._id.toString(), n.count]));
        const actionMap = new Map(actionCounts.map((a: any) => [a._id.toString(), a.count]));

        // Serialization
        return {
            leads: leads.map(l => {
                const id = l._id.toString();
                return {
                    ...l,
                    _id: id,
                    starred: (l.starred || []).map((s: any) => s.toString()),
                    assignedTo: l.assignedTo ? {
                        ...l.assignedTo,
                        _id: (l.assignedTo as any)._id?.toString()
                    } : null,
                    createdBy: l.createdBy ? {
                        _id: ((l.createdBy as any)._id || l.createdBy).toString(),
                        name: (l.createdBy as any).name || null,
                    } : null,
                    serialNumber: l.serialNumber || null,
                    countryCode: l.countryCode || "971",
                    customFields: l.customFields || {},
                    deletedAt: l.deletedAt ? (l.deletedAt as Date).toISOString() : null,
                    createdAt: (l.createdAt as Date).toISOString(),
                    updatedAt: (l.updatedAt as Date).toISOString(),
                    noteCount: noteMap.get(id) || 0,
                    actionCount: actionMap.get(id) || 0,
                    followUpDate: l.followUpDate ? (l.followUpDate as Date).toISOString() : null,
                };
            }),
            total
        };
    } catch (error) {
        console.error("getLeads error:", error);
        return { leads: [], total: 0 };
    }
}

// ─── Lead Statistics ────────────────────────────────────────────────────────
export async function getLeadsStats() {
    const session = await auth();
    if (!session) return [];

    try {
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
    } catch (error) {
        console.error("getLeadsStats error:", error);
        return [];
    }
}

// ─── Search leads ───────────────────────────────────────────────────────────
export async function searchLeads(query: string) {
    const session = await auth();
    if (!session || !query || query.length < 2) return [];

    try {
        await dbConnect();
        const searchDigits = query.replace(/[^0-9]/g, "");
        const searchNoPrefix = query.replace(/^[#]?/i, "");
        const filter: any = {
            deletedAt: null,
            $or: [
                { name: { $regex: query, $options: "i" } },
                { company: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { phone: { $regex: query, $options: "i" } },
                ...(searchDigits.length >= 3 ? [{ serialNumber: parseInt(searchDigits, 10) || -1 }] : []),
                ...(searchNoPrefix !== query && searchNoPrefix.length >= 3 ? [{ serialNumber: parseInt(searchNoPrefix, 10) || -1 }] : []),
            ],
        };

        // RBAC
        if (session.user.role === USER_ROLES.SALES) {
            filter.assignedTo = session.user.id;
        }

        const leads = await Lead.find(filter)
            .select("name company status phone email serialNumber")
            .sort({ updatedAt: -1 })
            .limit(8)
            .lean();

        return leads.map((l: any) => ({
            _id: l._id.toString(),
            name: l.name,
            company: l.company || "",
            status: l.status,
            phone: l.phone || "",
            email: l.email || "",
            serialNumber: l.serialNumber || null,
        }));
    } catch (error) {
        console.error("searchLeads error:", error);
        return [];
    }
}

// ─── Get lead details ───────────────────────────────────────────────────────
export async function getLeadDetails(id: string) {
    const session = await auth();
    if (!session) return null;

    try {
        await dbConnect();
        const lead = await Lead.findById(id)
            .populate("assignedTo", "name")
            .populate("createdBy", "name")
            .lean();
        if (!lead) return null;

        // RBAC: Admin sees all, Marketing sees all (read-only), Sales sees only assigned
        const assignedId = lead.assignedTo?._id?.toString() || lead.assignedTo?.toString();
        if (session.user.role === USER_ROLES.SALES && assignedId !== session.user.id) {
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

        const l = lead as any;
        return {
            lead: {
                _id: l._id.toString(),
                name: l.name,
                company: l.company || null,
                email: l.email || null,
                phone: l.phone || null,
                website: l.website || null,
                source: l.source || null,
                status: l.status || null,
                product: l.product || null,
                description: l.description || null,
                value: l.value ?? null,
                currency: l.currency || "USD",
                tags: (l.tags || []).map((t: any) => t.toString()),
                starred: (l.starred || []).map((s: any) => s.toString()),
                public: l.public ?? false,
                contactedToday: l.contactedToday ?? false,
                deletedAt: l.deletedAt ? l.deletedAt.toISOString() : null,
                address: l.address ? {
                    addressLine: l.address.addressLine || null,
                    city: l.address.city || null,
                    state: l.address.state || null,
                    country: l.address.country || null,
                } : null,
                assignedTo: l.assignedTo ? {
                    _id: (l.assignedTo._id || l.assignedTo).toString(),
                    name: l.assignedTo.name || null,
                } : null,
                createdBy: l.createdBy ? {
                    _id: ((l.createdBy as any)._id || l.createdBy).toString(),
                    name: (l.createdBy as any).name || null,
                } : null,
                updatedBy: l.updatedBy?.toString() || null,
                serialNumber: l.serialNumber || null,
                countryCode: l.countryCode || "971",
                createdAt: l.createdAt.toISOString(),
                updatedAt: l.updatedAt.toISOString(),
                lastContactAt: l.lastContactAt?.toISOString() || null,
                followUpDate: l.followUpDate ? l.followUpDate.toISOString() : null,
            },
            notes: notes.map(n => ({
                _id: n._id.toString(),
                leadId: (n as any).leadId?.toString() || null,
                message: (n as any).message || null,
                type: (n as any).type || null,
                authorId: n.authorId ? {
                    _id: (n.authorId._id || n.authorId).toString(),
                    name: (n.authorId as any).name || null,
                } : null,
                createdAt: n.createdAt.toISOString(),
            })),
            actions: actions.map(a => ({
                _id: a._id.toString(),
                leadId: (a as any).leadId.toString(),
                type: (a as any).type || null,
                description: (a as any).description || null,
                outcome: (a as any).outcome || null,
                scheduledAt: (a as any).scheduledAt?.toISOString() || null,
                completedAt: (a as any).completedAt?.toISOString() || null,
                authorId: a.authorId ? {
                    _id: (a.authorId._id || a.authorId).toString(),
                    name: (a.authorId as any).name || null,
                } : null,
                createdAt: a.createdAt.toISOString(),
                updatedAt: a.updatedAt.toISOString(),
            })),
        };
    } catch (error) {
        console.error("getLeadDetails error:", error);
        return null;
    }
}
