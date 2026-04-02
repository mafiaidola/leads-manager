/**
 * @route GET /api/cron/auto-checkout
 * @description Cron job that auto-checks out users who forgot to check out.
 * Runs every 30 minutes. Uses lastActivityAt as checkout time.
 * 
 * Logic:
 * 1. Find all unclosed attendance logs for today
 * 2. For each, check if current time > org endTime + 30 min buffer
 * 3. If yes, auto-checkout using lastActivityAt (or endTime as fallback)
 */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AttendanceLog from "@/models/AttendanceLog";
import Organization from "@/models/Organization";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    // Verify cron secret in production
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const today = new Date().toISOString().split("T")[0];
        const now = new Date();

        // Find all unclosed logs for today
        const openLogs = await AttendanceLog.find({
            date: today,
            lastLogout: { $exists: false },
        });

        if (openLogs.length === 0) {
            // Also check for null lastLogout
            const nullLogs = await AttendanceLog.find({
                date: today,
                lastLogout: null,
            });
            
            if (nullLogs.length === 0) {
                return NextResponse.json({ message: "No open logs", processed: 0 });
            }
            
            // Process null logs
            let processed = 0;
            for (const log of nullLogs) {
                const result = await autoCheckoutLog(log, now);
                if (result) processed++;
            }
            return NextResponse.json({ message: "Auto-checkout complete", processed });
        }

        let processed = 0;
        for (const log of openLogs) {
            const result = await autoCheckoutLog(log, now);
            if (result) processed++;
        }

        return NextResponse.json({
            message: "Auto-checkout complete",
            processed,
            total: openLogs.length,
        });
    } catch (err) {
        console.error("Auto-checkout cron error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

async function autoCheckoutLog(log: any, now: Date): Promise<boolean> {
    try {
        // Get org schedule
        const org = await Organization.findById(log.orgId)
            .select("settings.workSchedule")
            .lean();
        const schedule = (org as any)?.settings?.workSchedule;

        if (!schedule?.enabled || !schedule?.endTime) {
            // No schedule — auto-checkout if more than 12 hours since check-in
            const hoursSinceCheckIn = (now.getTime() - new Date(log.firstLogin).getTime()) / (1000 * 60 * 60);
            if (hoursSinceCheckIn < 12) return false; // Too early to auto-checkout
        } else {
            // Check if past endTime + 30 min buffer
            const [endH, endM] = schedule.endTime.split(":").map(Number);
            const endMinutes = endH * 60 + endM + 30; // 30 min buffer
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            if (currentMinutes < endMinutes) return false; // Not yet time
        }

        // Use lastActivityAt as checkout time, or endTime, or now
        let checkoutTime = now;
        if (log.lastActivityAt) {
            checkoutTime = new Date(log.lastActivityAt);
        } else if (schedule?.endTime) {
            const [endH, endM] = schedule.endTime.split(":").map(Number);
            checkoutTime = new Date(now);
            checkoutTime.setHours(endH, endM, 0, 0);
        }

        log.lastLogout = checkoutTime;
        log.autoCheckedOut = true;
        log.checkOutMethod = log.lastActivityAt ? "AUTO_INACTIVITY" : "AUTO_ENDTIME";

        const diffMs = checkoutTime.getTime() - new Date(log.firstLogin).getTime();
        log.totalMinutes = Math.max(0, Math.round(diffMs / 60000));

        // Calculate overtime if applicable
        if (schedule?.enabled && schedule?.endTime) {
            const [endH, endM] = schedule.endTime.split(":").map(Number);
            const endMinutes = endH * 60 + endM;
            const checkoutMinutes = checkoutTime.getHours() * 60 + checkoutTime.getMinutes();
            if (checkoutMinutes > endMinutes) {
                log.overtimeMinutes = checkoutMinutes - endMinutes;
            }
        }

        await log.save();
        console.log(`Auto-checkout: ${log.userName} (${log.checkOutMethod}) at ${checkoutTime.toISOString()}`);
        return true;
    } catch (err) {
        console.error(`Auto-checkout failed for ${log.userName}:`, err);
        return false;
    }
}
