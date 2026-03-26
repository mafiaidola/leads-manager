/**
 * @route GET /api/cron/backup
 * @description Vercel Cron job endpoint for automated backups.
 * Runs on schedule (configured in vercel.json), exports data for all active
 * organizations and records results in BackupHistory.
 * 
 * Protected by CRON_SECRET environment variable.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Organization from "@/models/Organization";
import User from "@/models/User";
import Lead from "@/models/Lead";
import LeadNote from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";
import BackupHistory from "@/models/BackupHistory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();

        // Get all active organizations
        const orgs = await Organization.find({ active: true }).lean();
        const results: Array<{ org: string; status: string; size?: number }> = [];

        for (const org of orgs) {
            try {
                // Fetch all org-scoped data
                const [users, leads, notes, actions, auditLogs, notifications] = await Promise.all([
                    User.find({ orgId: org._id }).select("-passwordHash").lean(),
                    Lead.find({ orgId: org._id }).lean(),
                    LeadNote.find({ orgId: org._id }).lean(),
                    LeadAction.find({ orgId: org._id }).lean(),
                    AuditLog.find({ orgId: org._id }).sort({ createdAt: -1 }).limit(5000).lean(),
                    Notification.find({ orgId: org._id }).sort({ createdAt: -1 }).limit(2000).lean(),
                ]);

                const backup = {
                    _meta: {
                        version: "1.0",
                        exportedAt: new Date().toISOString(),
                        exportedBy: "Automated Cron Backup",
                        orgName: org.name,
                        orgSlug: org.slug,
                    },
                    organization: org,
                    users,
                    leads,
                    notes,
                    actions,
                    auditLogs,
                    notifications,
                    _stats: {
                        users: users.length,
                        leads: leads.length,
                        notes: notes.length,
                        actions: actions.length,
                        auditLogs: auditLogs.length,
                        notifications: notifications.length,
                    },
                };

                const jsonStr = JSON.stringify(backup, null, 2);
                const fileSize = Buffer.byteLength(jsonStr, "utf-8");
                const fileName = `backup-${org.slug}-${new Date().toISOString().slice(0, 10)}.json`;

                // Store backup in Vercel Blob if available
                let downloadUrl: string | undefined;
                try {
                    const { put } = await import("@vercel/blob");
                    const blob = await put(`backups/${fileName}`, jsonStr, {
                        access: "public",
                        contentType: "application/json",
                    });
                    downloadUrl = blob.url;
                } catch {
                    // Vercel Blob not available — backup JSON not stored externally
                    // Still record the backup attempt in history
                }

                // Record backup history
                await BackupHistory.create({
                    orgId: org._id,
                    orgName: org.name,
                    fileName,
                    fileSize,
                    downloadUrl,
                    status: "completed",
                    triggeredBy: "cron",
                });

                results.push({ org: org.name, status: "completed", size: fileSize });
            } catch (err: any) {
                // Record failed backup
                await BackupHistory.create({
                    orgId: org._id,
                    orgName: org.name,
                    fileName: `backup-${org.slug}-failed.json`,
                    fileSize: 0,
                    status: "failed",
                    error: err.message,
                    triggeredBy: "cron",
                });
                results.push({ org: org.name, status: "failed" });
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            orgsProcessed: orgs.length,
            results,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
