/**
 * @route POST /api/attendance/logout
 * @description Records logout timestamp when user closes tab or logs out.
 * Uses `navigator.sendBeacon` from the client for reliable delivery.
 * Enhanced: now stores checkOutMethod, overtime, and lastActivityAt.
 */
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import AttendanceLog from "@/models/AttendanceLog";
import Organization from "@/models/Organization";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = (session.user as any).id;
        await dbConnect();
        const today = new Date().toISOString().split("T")[0];
        const now = new Date();

        const log = await AttendanceLog.findOne({ userId, date: today });
        if (log && !log.lastLogout) {
            log.lastLogout = now;
            log.lastActivityAt = now;
            log.checkOutMethod = "BEACON";
            const diffMs = now.getTime() - new Date(log.firstLogin).getTime();
            log.totalMinutes = Math.round(diffMs / 60000);

            // Check early leave + overtime
            const org = await Organization.findById(log.orgId).select("settings.workSchedule").lean();
            const schedule = (org as any)?.settings?.workSchedule;
            if (schedule?.enabled && schedule?.endTime) {
                const [endH, endM] = schedule.endTime.split(":").map(Number);
                const endMinutes = endH * 60 + endM;
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                if (currentMinutes < endMinutes && log.status !== "LATE") {
                    log.status = "EARLY_LEAVE";
                }
                if (currentMinutes > endMinutes) {
                    log.overtimeMinutes = currentMinutes - endMinutes;
                }
            }
            await log.save();
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Attendance logout error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
