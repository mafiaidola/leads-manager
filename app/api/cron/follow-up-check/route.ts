/**
 * @route GET /api/cron/follow-up-check
 * @description Cron job to find overdue follow-ups and send notifications.
 * Can be triggered by Vercel Cron (every hour) or manually.
 * Prevents duplicate notifications by checking the last 24h.
 */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    // Optional: verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Find leads with overdue follow-ups
        const overdueLeads = await Lead.find({
            deletedAt: null,
            followUpDate: { $lt: now },
            assignedTo: { $exists: true, $ne: null },
        })
            .select("_id name assignedTo orgId followUpDate")
            .lean();

        if (overdueLeads.length === 0) {
            return NextResponse.json({ message: "No overdue follow-ups", count: 0 });
        }

        let notified = 0;

        for (const lead of overdueLeads as any[]) {
            // Check if we already sent a notification for this lead in the last 24h
            const existing = await Notification.findOne({
                userId: lead.assignedTo,
                type: "follow_up_overdue",
                leadId: lead._id,
                createdAt: { $gte: oneDayAgo },
            });

            if (!existing) {
                await Notification.create({
                    orgId: lead.orgId,
                    userId: lead.assignedTo,
                    type: "follow_up_overdue",
                    title: "⚠️ Follow-up Overdue",
                    message: `Follow-up for "${lead.name}" was due ${new Date(lead.followUpDate).toLocaleDateString()}`,
                    leadId: lead._id,
                    read: false,
                });
                notified++;
            }
        }

        return NextResponse.json({
            message: `Checked ${overdueLeads.length} overdue leads, sent ${notified} notifications`,
            checked: overdueLeads.length,
            notified,
        });
    } catch (error) {
        console.error("Follow-up cron error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
