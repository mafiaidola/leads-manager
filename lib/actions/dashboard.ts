"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote from "@/models/LeadNote";
import { USER_ROLES } from "@/models/User";

export async function getDashboardStats() {
    const session = await auth();
    if (!session) return null;

    await dbConnect();

    const matchStage: any = { deletedAt: null };
    if (session.user.role === USER_ROLES.SALES) {
        matchStage.assignedTo = session.user.id;
    }
    // Marketing and Admin see all leads (soft-deleted excluded)

    const [
        totalLeads,
        leadsByStatus,
        newLeadsLast7Days,
        newLeadsLast30Days,
        customers,
        leadsBySource,
        recentLeads,
        monthlyTrends,
        recentActivity
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
        // Monthly Trend (Last 6 months) - Simplified for now, just count by month
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
        // Recent Activity
        LeadNote.find(
            session.user.role === USER_ROLES.SALES
                ? { leadId: { $in: await Lead.find(matchStage).distinct("_id") } } // Only notes for assigned leads
                : {}
        )
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("leadId", "name")
            .populate("authorId", "name")
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
    };
}
