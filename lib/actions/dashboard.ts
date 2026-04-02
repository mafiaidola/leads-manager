/**
 * @module lib/actions/dashboard
 * @description Server actions for dashboard KPIs and analytics.
 *
 * Exports:
 * - `getDashboardStats` — aggregated stats (total, by-status, conversion rate,
 *   recent leads, recent activity, monthly trends, goal progress, revenue)
 *
 * Uses `Promise.all` for parallel fetching.
 * SuperAdmin gets cross-org analytics via `getCrossOrgStats`.
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote from "@/models/LeadNote";
import { USER_ROLES } from "@/models/User";
import Organization from "@/models/Organization";
import mongoose from "mongoose";

export async function getDashboardStats(
    dateRange?: "7d" | "30d" | "90d" | "all",
    agentId?: string,
    startDate?: string,
    endDate?: string
) {
    const session = await auth();
    if (!session || !session.user?.orgId) return null;

    try {
        await dbConnect();

        // Fetch org settings for dynamic sale status detection
        const org = await Organization.findById(session.user.orgId)
            .select("settings.statuses settings.defaultCurrency")
            .lean() as any;
        const saleStatusKeys: string[] = (org?.settings?.statuses || [])
            .filter((s: any) => s.isSaleStatus)
            .map((s: any) => s.key);
        const defaultCurrency = org?.settings?.defaultCurrency || "AED";
        // Parse orgId safely — aggregation does strict type comparison, 
        // so we need to match however the leads stored it (ObjectId or string)
        let parsedOrgId: any;
        try {
            parsedOrgId = new mongoose.Types.ObjectId(session.user.orgId as string);
        } catch {
            parsedOrgId = session.user.orgId;
        }

        const matchStage: any = { deletedAt: null, orgId: parsedOrgId };
        if (session.user.role === USER_ROLES.SALES) {
            matchStage.assignedTo = new mongoose.Types.ObjectId(session.user.id);
        }

        // Agent filter (Admin/Marketing only) — overrides role-based default
        if (agentId && session.user.role !== USER_ROLES.SALES) {
            matchStage.assignedTo = new mongoose.Types.ObjectId(agentId);
        }

        // Custom date range takes priority over preset
        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        } else if (dateRange && dateRange !== "all") {
            const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
            matchStage.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
        }

        // Build customers match — dynamically from isSaleStatus
        const customerMatch = saleStatusKeys.length > 0
            ? { ...matchStage, status: { $in: saleStatusKeys } }
            : { ...matchStage, status: { $regex: /customer|won|order/i } };

        // Pre-fetch lead IDs for Sales role activity filtering
        const leadIdsForActivity =
            session.user.role === USER_ROLES.SALES
                ? await Lead.find(matchStage).distinct("_id")
                : null;

        const [
            totalLeads,
            leadsByStatus,
            newLeadsLast7Days,
            newLeadsLast30Days,
            customers,
            leadsBySource,
            recentLeads,
            monthlyTrends,
            recentActivity,
            agentLeaderboard,
            totalRevenueAgg,
            agentRevenueDetails,
            revenueByMonth,
        ] = await Promise.all([
            Lead.countDocuments(matchStage),
            Lead.aggregate([
                { $match: matchStage },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            Lead.countDocuments({
                ...matchStage,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),
            Lead.countDocuments({
                ...matchStage,
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            }),
            Lead.countDocuments(customerMatch),
            // Leads by Source
            Lead.aggregate([
                { $match: matchStage },
                { $group: { _id: "$source", count: { $sum: 1 } } },
            ]),
            // Recent Leads
            Lead.find(matchStage).sort({ createdAt: -1 }).limit(5).populate("assignedTo", "name email").lean(),
            // Monthly Trend (Last 6 months)
            Lead.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Recent Activity — uses pre-fetched leadIds for Sales filtering
            LeadNote.find(
                leadIdsForActivity
                    ? { leadId: { $in: leadIdsForActivity } }
                    : {}
            )
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("leadId", "name")
                .populate("authorId", "name")
                .lean(),
            // Agent Leaderboard with revenue
            Lead.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: "$assignedTo",
                        total: { $sum: 1 },
                        won: {
                            $sum: {
                                $cond: [
                                    saleStatusKeys.length > 0
                                        ? { $in: ["$status", saleStatusKeys] }
                                        : { $regexMatch: { input: { $toLower: { $ifNull: ["$status", ""] } }, regex: "won|customer|order" } },
                                    1, 0
                                ]
                            }
                        },
                        revenue: {
                            $sum: {
                                $cond: [
                                    saleStatusKeys.length > 0
                                        ? { $in: ["$status", saleStatusKeys] }
                                        : { $regexMatch: { input: { $toLower: { $ifNull: ["$status", ""] } }, regex: "won|customer|order" } },
                                    { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] },
                                    0
                                ]
                            }
                        }
                    }
                },
                { $sort: { won: -1, total: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "agent"
                    }
                },
                { $unwind: { path: "$agent", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        total: 1,
                        won: 1,
                        revenue: 1,
                        agentName: { $ifNull: ["$agent.name", "Unassigned"] },
                        agentRole: { $ifNull: ["$agent.role", "UNASSIGNED"] }
                    }
                }
            ]),
            // Total Revenue (actual + original)
            Lead.aggregate([
                { $match: customerMatch },
                {
                    $group: {
                        _id: null,
                        actualTotal: { $sum: { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] } },
                        originalTotal: { $sum: { $ifNull: ["$productPrice", 0] } },
                    }
                }
            ]),
            // ── Detailed Revenue Analytics ──
            // Per-agent revenue breakdown: original vs actual
            Lead.aggregate([
                { $match: customerMatch },
                {
                    $group: {
                        _id: "$assignedTo",
                        leadsSold: { $sum: 1 },
                        originalRevenue: { $sum: { $ifNull: ["$productPrice", 0] } },
                        actualRevenue: { $sum: { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] } },
                        profitLoss: {
                            $sum: {
                                $subtract: [
                                    { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] },
                                    { $ifNull: ["$productPrice", 0] }
                                ]
                            }
                        },
                    }
                },
                { $sort: { actualRevenue: -1 } },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "agent"
                    }
                },
                { $unwind: { path: "$agent", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        leadsSold: 1,
                        originalRevenue: 1,
                        actualRevenue: 1,
                        profitLoss: 1,
                        agentName: { $ifNull: ["$agent.name", "Unassigned"] },
                        agentRole: { $ifNull: ["$agent.role", "UNASSIGNED"] },
                    }
                }
            ]),
            // Monthly revenue trend: original vs actual
            Lead.aggregate([
                { $match: customerMatch },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 },
                        originalRevenue: { $sum: { $ifNull: ["$productPrice", 0] } },
                        actualRevenue: { $sum: { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] } },
                    }
                },
                { $sort: { _id: 1 } }
            ]),
        ]);

        // Separate discount/extra value aggregation (non-critical — won't break dashboard if it fails)
        let discountTotal = 0, discountCount = 0, extraValueTotal = 0, extraValueCount = 0;
        try {
            const [discountAgg, extraAgg] = await Promise.all([
                Lead.aggregate([
                    { $match: { ...customerMatch, productPrice: { $gt: 0 }, customPrice: { $gt: 0 } } },
                    { $match: { $expr: { $lt: ["$customPrice", "$productPrice"] } } },
                    { $group: { _id: null, total: { $sum: { $subtract: ["$productPrice", "$customPrice"] } }, count: { $sum: 1 } } },
                ]),
                Lead.aggregate([
                    { $match: { ...customerMatch, productPrice: { $gt: 0 }, customPrice: { $gt: 0 } } },
                    { $match: { $expr: { $gt: ["$customPrice", "$productPrice"] } } },
                    { $group: { _id: null, total: { $sum: { $subtract: ["$customPrice", "$productPrice"] } }, count: { $sum: 1 } } },
                ]),
            ]);
            discountTotal = discountAgg[0]?.total || 0;
            discountCount = discountAgg[0]?.count || 0;
            extraValueTotal = extraAgg[0]?.total || 0;
            extraValueCount = extraAgg[0]?.count || 0;
        } catch (discErr) {
            console.warn("Discount/extra value aggregation failed (non-critical):", discErr);
        }

        return {
            totalLeads,
            leadsByStatus: leadsByStatus.map((item) => ({
                status: item._id,
                count: item.count,
            })),
            newLeadsLast7Days,
            newLeadsLast30Days,
            customers,
            leadsBySource: leadsBySource.map((item: any) => ({
                source: item._id || "Unknown",
                count: item.count
            })),
            recentLeads: JSON.parse(JSON.stringify(recentLeads)),
            recentActivity: JSON.parse(JSON.stringify(recentActivity)),
            monthlyTrends: (() => {
                const raw = monthlyTrends.map((item) => ({
                    name: item._id,
                    total: item.count,
                }));
                // Fill missing months with 0 for the last 6 months
                const months: { name: string; total: number }[] = [];
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    const found = raw.find((r) => r.name === key);
                    months.push({ name: key, total: found?.total || 0 });
                }
                return months;
            })(),
            agentLeaderboard: agentLeaderboard.map((item: any) => ({
                agentName: item.agentName,
                agentRole: item.agentRole,
                total: item.total,
                won: item.won,
                revenue: item.revenue || 0,
            })),
            totalRevenue: totalRevenueAgg[0]?.actualTotal || 0,
            totalOriginalRevenue: totalRevenueAgg[0]?.originalTotal || 0,
            totalDiscounts: discountTotal,
            totalDiscountCount: discountCount,
            totalExtraValue: extraValueTotal,
            totalExtraValueCount: extraValueCount,
            defaultCurrency,
            agentRevenueDetails: agentRevenueDetails.map((item: any) => ({
                agentName: item.agentName,
                agentRole: item.agentRole,
                leadsSold: item.leadsSold,
                originalRevenue: item.originalRevenue || 0,
                actualRevenue: item.actualRevenue || 0,
                profitLoss: item.profitLoss || 0,
            })),
            revenueByMonth: (() => {
                const raw = revenueByMonth.map((item: any) => ({
                    name: item._id,
                    count: item.count,
                    originalRevenue: item.originalRevenue || 0,
                    actualRevenue: item.actualRevenue || 0,
                }));
                // Fill missing months with 0 for the last 6 months
                const months: { name: string; count: number; originalRevenue: number; actualRevenue: number }[] = [];
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    const found = raw.find((r) => r.name === key);
                    months.push({
                        name: key,
                        count: found?.count || 0,
                        originalRevenue: found?.originalRevenue || 0,
                        actualRevenue: found?.actualRevenue || 0,
                    });
                }
                return months;
            })(),
        };
    } catch (error) {
        console.error("getDashboardStats error:", error instanceof Error ? error.message : error);
        console.error("getDashboardStats stack:", error instanceof Error ? error.stack : "no stack");
        return null;
    }
}

// ─── Revenue by Period (Today/Week/Month/Year/All) ──────────────────────────
export async function getRevenueByPeriod(period: "today" | "week" | "month" | "year" | "all") {
    const session = await auth();
    if (!session || !session.user?.orgId) return null;

    try {
        await dbConnect();
        const org = await Organization.findById(session.user.orgId)
            .select("settings.statuses settings.defaultCurrency")
            .lean() as any;
        const saleStatusKeys: string[] = (org?.settings?.statuses || [])
            .filter((s: any) => s.isSaleStatus)
            .map((s: any) => s.key);
        const defaultCurrency = org?.settings?.defaultCurrency || "AED";

        let parsedOrgId: any;
        try {
            parsedOrgId = new mongoose.Types.ObjectId(session.user.orgId as string);
        } catch {
            parsedOrgId = session.user.orgId;
        }
        const matchStage: any = {
            deletedAt: null,
            orgId: parsedOrgId,
        };

        // Sale status filter
        if (saleStatusKeys.length > 0) {
            matchStage.status = { $in: saleStatusKeys };
        } else {
            matchStage.status = { $regex: /customer|won|order/i };
        }

        // Period date filter
        const now = new Date();
        if (period === "today") {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            matchStage.createdAt = { $gte: startOfDay };
        } else if (period === "week") {
            const dayOfWeek = now.getDay(); // 0=Sun
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            matchStage.createdAt = { $gte: startOfWeek };
        } else if (period === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            matchStage.createdAt = { $gte: startOfMonth };
        } else if (period === "year") {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            matchStage.createdAt = { $gte: startOfYear };
        }
        // "all" = no date filter

        const [totals, agentBreakdown] = await Promise.all([
            Lead.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        originalRevenue: { $sum: { $ifNull: ["$productPrice", 0] } },
                        actualRevenue: { $sum: { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] } },
                    }
                }
            ]),
            Lead.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: "$assignedTo",
                        leadsSold: { $sum: 1 },
                        originalRevenue: { $sum: { $ifNull: ["$productPrice", 0] } },
                        actualRevenue: { $sum: { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] } },
                    }
                },
                { $sort: { actualRevenue: -1 } },
                { $limit: 10 },
                { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "agent" } },
                { $unwind: { path: "$agent", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        leadsSold: 1,
                        originalRevenue: 1,
                        actualRevenue: 1,
                        profitLoss: { $subtract: ["$actualRevenue", "$originalRevenue"] },
                        agentName: { $ifNull: ["$agent.name", "Unassigned"] },
                        agentRole: { $ifNull: ["$agent.role", "UNASSIGNED"] },
                    }
                }
            ]),
        ]);

        // Separate discount/extra queries (non-critical)
        let discTotal = 0, discCount = 0, extTotal = 0, extCount = 0;
        try {
            const [dAgg, eAgg] = await Promise.all([
                Lead.aggregate([
                    { $match: { ...matchStage, productPrice: { $gt: 0 }, customPrice: { $gt: 0 } } },
                    { $match: { $expr: { $lt: ["$customPrice", "$productPrice"] } } },
                    { $group: { _id: null, total: { $sum: { $subtract: ["$productPrice", "$customPrice"] } }, count: { $sum: 1 } } },
                ]),
                Lead.aggregate([
                    { $match: { ...matchStage, productPrice: { $gt: 0 }, customPrice: { $gt: 0 } } },
                    { $match: { $expr: { $gt: ["$customPrice", "$productPrice"] } } },
                    { $group: { _id: null, total: { $sum: { $subtract: ["$customPrice", "$productPrice"] } }, count: { $sum: 1 } } },
                ]),
            ]);
            discTotal = dAgg[0]?.total || 0;
            discCount = dAgg[0]?.count || 0;
            extTotal = eAgg[0]?.total || 0;
            extCount = eAgg[0]?.count || 0;
        } catch (e) {
            console.warn("Revenue period discount aggregation failed:", e);
        }

        const t = totals[0] || { count: 0, originalRevenue: 0, actualRevenue: 0 };
        const profitLoss = t.actualRevenue - t.originalRevenue;
        const margin = t.originalRevenue > 0 ? ((profitLoss / t.originalRevenue) * 100) : 0;

        return {
            period,
            salesCount: t.count,
            originalRevenue: t.originalRevenue,
            actualRevenue: t.actualRevenue,
            profitLoss,
            margin: parseFloat(margin.toFixed(1)),
            totalDiscounts: discTotal,
            totalDiscountCount: discCount,
            totalExtraValue: extTotal,
            totalExtraValueCount: extCount,
            currency: defaultCurrency,
            agentBreakdown: agentBreakdown.map((a: any) => ({
                agentName: a.agentName,
                agentRole: a.agentRole,
                leadsSold: a.leadsSold,
                originalRevenue: a.originalRevenue || 0,
                actualRevenue: a.actualRevenue || 0,
                profitLoss: a.profitLoss || 0,
            })),
        };
    } catch (error) {
        console.error("getRevenueByPeriod error:", error);
        return null;
    }
}

// ─── Personal Stats for Sales Dashboard ─────────────────────────────────────
export async function getPersonalStats() {
    const session = await auth();
    if (!session || !session.user?.orgId) return null;

    try {
        await dbConnect();
        const userId = new mongoose.Types.ObjectId(session.user.id);
        const orgId = new mongoose.Types.ObjectId(session.user.orgId as string);
        const isSales = session.user.role === USER_ROLES.SALES;

        const org = await Organization.findById(session.user.orgId)
            .select("settings.statuses settings.defaultCurrency")
            .lean() as any;
        const saleStatusKeys: string[] = (org?.settings?.statuses || [])
            .filter((s: any) => s.isSaleStatus)
            .map((s: any) => s.key);
        const defaultCurrency = org?.settings?.defaultCurrency || "AED";

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const baseMatch: any = { deletedAt: null, orgId };
        if (isSales) baseMatch.assignedTo = userId;

        const saleMatch: any = { ...baseMatch };
        if (saleStatusKeys.length > 0) saleMatch.status = { $in: saleStatusKeys };

        const [
            leadsToday,
            leadsThisMonth,
            revenueThisMonth,
            recentLeads,
        ] = await Promise.all([
            Lead.countDocuments({ ...baseMatch, createdAt: { $gte: startOfDay } }),
            Lead.countDocuments({ ...baseMatch, createdAt: { $gte: startOfMonth } }),
            Lead.aggregate([
                { $match: { ...saleMatch, createdAt: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: null,
                        original: { $sum: { $ifNull: ["$productPrice", 0] } },
                        actual: { $sum: { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] } },
                        count: { $sum: 1 },
                    }
                }
            ]),
            Lead.find(baseMatch)
                .sort({ updatedAt: -1 })
                .limit(5)
                .select("name status updatedAt customPrice productPrice")
                .lean(),
        ]);

        const rev = revenueThisMonth[0] || { original: 0, actual: 0, count: 0 };

        return {
            leadsToday,
            leadsThisMonth,
            salesThisMonth: rev.count,
            revenueThisMonth: {
                original: rev.original,
                actual: rev.actual,
                profitLoss: rev.actual - rev.original,
            },
            recentLeads: JSON.parse(JSON.stringify(recentLeads)),
            currency: defaultCurrency,
            userId: session.user.id,
            userName: session.user.name,
            role: session.user.role,
        };
    } catch (error) {
        console.error("getPersonalStats error:", error);
        return null;
    }
}
