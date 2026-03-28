/**
 * @module lib/actions/quality
 * @description Server actions for the IQA Quality section.
 *
 * Exports:
 * - `getAbandonedLeads` — leads with no status change in X days
 * - `getInactiveUsers` — users with no login in X days
 * - `getTargetProgress` — all users' target completion progress
 * - `getUserPerformance` — detailed per-user metrics
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import User, { USER_ROLES } from "@/models/User";
import Organization from "@/models/Organization";
import { serialize } from "@/lib/serialize";

// ─── Abandoned Leads ─────────────────────────────────────────────────────────
export async function getAbandonedLeads(days: number = 7, filters?: { agentId?: string; status?: string }) {
    const session = await auth();
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== "IQA")) {
        return { leads: [], total: 0 };
    }

    await dbConnect();
    const orgId = session.user.orgId;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const query: any = {
        orgId,
        deletedAt: { $exists: false },
        updatedAt: { $lt: cutoff },
    };

    if (filters?.agentId && filters.agentId !== "all") {
        query.assignedTo = filters.agentId;
    }
    if (filters?.status && filters.status !== "all") {
        query.status = filters.status;
    }

    const leads = await Lead.find(query)
        .populate("assignedTo", "name username")
        .sort({ updatedAt: 1 })
        .limit(200)
        .lean();

    const total = await Lead.countDocuments(query);

    return {
        leads: serialize(leads.map((l: any) => ({
            _id: l._id.toString(),
            name: l.name,
            phone: l.phone,
            email: l.email,
            status: l.status,
            source: l.source,
            assignedTo: l.assignedTo ? {
                _id: l.assignedTo._id.toString(),
                name: l.assignedTo.name,
                username: l.assignedTo.username,
            } : null,
            updatedAt: l.updatedAt?.toISOString(),
            createdAt: l.createdAt?.toISOString(),
            daysSinceUpdate: Math.floor((Date.now() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
        }))),
        total,
    };
}

// ─── Inactive Users ──────────────────────────────────────────────────────────
export async function getInactiveUsers(days: number = 7) {
    const session = await auth();
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== "IQA")) {
        return [];
    }

    await dbConnect();
    const orgId = session.user.orgId;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const users = await User.find({
        orgId,
        active: true,
        $or: [
            { lastLogin: { $lt: cutoff } },
            { lastLogin: { $exists: false } },
            { lastLogin: null },
        ],
    })
        .select("name username role lastLogin createdAt")
        .sort({ lastLogin: 1 })
        .lean();

    // Count assigned leads for each user
    const userIds = users.map((u: any) => u._id);
    const leadCounts = await Lead.aggregate([
        { $match: { orgId: orgId as any, assignedTo: { $in: userIds }, deletedAt: { $exists: false } } },
        { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    leadCounts.forEach((lc: any) => { countMap[lc._id.toString()] = lc.count; });

    return serialize(users.map((u: any) => ({
        _id: u._id.toString(),
        name: u.name,
        username: u.username,
        role: u.role,
        lastLogin: u.lastLogin?.toISOString() || null,
        daysSinceLogin: u.lastLogin
            ? Math.floor((Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        totalLeads: countMap[u._id.toString()] || 0,
    })));
}

// ─── Target Progress ─────────────────────────────────────────────────────────
export async function getTargetProgress() {
    const session = await auth();
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== "IQA")) {
        return { users: [], targets: null };
    }

    await dbConnect();
    const orgId = session.user.orgId;

    // Get org targets
    const org = await Organization.findById(orgId).select("settings.goals").lean() as any;
    const targets = org?.settings?.goals || { monthlyLeadTarget: 50, monthlyConversionTarget: 10 };

    // Get all active users
    const users = await User.find({ orgId, active: true })
        .select("name username role")
        .lean();

    // Get current month's leads per user
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const pipeline = [
        {
            $match: {
                orgId: orgId as any,
                createdAt: { $gte: startOfMonth },
                deletedAt: { $exists: false },
            },
        },
        {
            $group: {
                _id: "$assignedTo",
                totalLeads: { $sum: 1 },
                customers: {
                    $sum: {
                        $cond: [{ $regexMatch: { input: "$status", regex: /customer/i } }, 1, 0],
                    },
                },
            },
        },
    ];

    const stats = await Lead.aggregate(pipeline);
    const statsMap: Record<string, { totalLeads: number; customers: number }> = {};
    stats.forEach((s: any) => {
        if (s._id) statsMap[s._id.toString()] = { totalLeads: s.totalLeads, customers: s.customers };
    });

    return {
        targets,
        users: serialize(users.map((u: any) => {
            const userStats = statsMap[u._id.toString()] || { totalLeads: 0, customers: 0 };
            return {
                _id: u._id.toString(),
                name: u.name,
                username: u.username,
                role: u.role,
                leadsThisMonth: userStats.totalLeads,
                conversionsThisMonth: userStats.customers,
                leadTargetPct: targets.monthlyLeadTarget ? Math.round((userStats.totalLeads / targets.monthlyLeadTarget) * 100) : 0,
                conversionTargetPct: targets.monthlyConversionTarget ? Math.round((userStats.customers / targets.monthlyConversionTarget) * 100) : 0,
            };
        })),
    };
}

// ─── User Performance (detailed) ─────────────────────────────────────────────
export async function getUserPerformance(userId?: string) {
    const session = await auth();
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== "IQA")) {
        return null;
    }

    await dbConnect();
    const orgId = session.user.orgId;

    // If no userId specified, return list of users to pick from
    if (!userId) {
        const users = await User.find({ orgId, active: true })
            .select("name username role")
            .lean();
        return { users: serialize(users), performance: null };
    }

    // Get all leads for this user
    const leads = await Lead.find({
        orgId,
        assignedTo: userId,
        deletedAt: { $exists: false },
    })
        .select("status source createdAt updatedAt")
        .lean();

    // Status distribution
    const statusDist: Record<string, number> = {};
    leads.forEach((l: any) => {
        statusDist[l.status] = (statusDist[l.status] || 0) + 1;
    });

    // Source distribution
    const sourceDist: Record<string, number> = {};
    leads.forEach((l: any) => {
        const src = l.source || "unknown";
        sourceDist[src] = (sourceDist[src] || 0) + 1;
    });

    // Conversion rate
    const customers = leads.filter((l: any) => /customer/i.test(l.status || "")).length;
    const conversionRate = leads.length > 0 ? parseFloat(((customers / leads.length) * 100).toFixed(1)) : 0;

    // Average response time (time between creation and first update)
    const responseTimes = leads
        .filter((l: any) => l.updatedAt && l.createdAt && l.updatedAt.getTime() !== l.createdAt.getTime())
        .map((l: any) => (l.updatedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60)); // hours
    const avgResponseHours = responseTimes.length > 0
        ? parseFloat((responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length).toFixed(1))
        : 0;

    // User info
    const user = await User.findById(userId).select("name username role lastLogin").lean();

    return {
        performance: {
            user: serialize(user),
            totalLeads: leads.length,
            customers,
            conversionRate,
            avgResponseHours,
            statusDistribution: Object.entries(statusDist).map(([status, count]) => ({ status, count })),
            sourceDistribution: Object.entries(sourceDist).map(([source, count]) => ({ source, count })),
        },
    };
}
