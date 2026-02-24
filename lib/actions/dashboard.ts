"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote from "@/models/LeadNote";
import { USER_ROLES } from "@/models/User";

export async function getDashboardStats(dateRange?: "7d" | "30d" | "90d" | "all") {
    const session = await auth();
    if (!session) return null;

    try {
        await dbConnect();

        const matchStage: any = { deletedAt: null };
        if (session.user.role === USER_ROLES.SALES) {
            matchStage.assignedTo = session.user.id;
        }
        // Apply date range filter
        if (dateRange && dateRange !== "all") {
            const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
            matchStage.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
        }
        // Marketing and Admin see all leads (soft-deleted excluded)

        // Pre-fetch lead IDs for Sales role activity filtering
        // (hoisted out of Promise.all to avoid nested sequential await)
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
            agentLeaderboard
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
            Lead.countDocuments({
                ...matchStage,
                status: "customer",
            }),
            // Leads by Source
            Lead.aggregate([
                { $match: matchStage },
                { $group: { _id: "$source", count: { $sum: 1 } } },
            ]),
            // Recent Leads
            Lead.find(matchStage).sort({ createdAt: -1 }).limit(5).populate("assignedTo", "name email"),
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
                .populate("authorId", "name"),
            // Agent Leaderboard
            Lead.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: "$assignedTo",
                        total: { $sum: 1 },
                        won: {
                            $sum: {
                                $cond: [{
                                    $regexMatch: { input: { $toLower: { $ifNull: ["$status", ""] } }, regex: "won|customer" }
                                }, 1, 0]
                            }
                        }
                    }
                },
                { $sort: { total: -1 } },
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
                        agentName: { $ifNull: ["$agent.name", "Unassigned"] },
                        agentRole: { $ifNull: ["$agent.role", "UNASSIGNED"] }
                    }
                }
            ])
        ]);

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
            })),
        };
    } catch (error) {
        console.error("getDashboardStats error:", error);
        return null;
    }
}
