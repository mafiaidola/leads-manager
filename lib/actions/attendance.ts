/**
 * @module lib/actions/attendance
 * @description Server actions for professional attendance tracking.
 *
 * - checkIn: explicit user check-in (creates attendance record, calculates late minutes)
 * - checkOut: explicit user check-out (sets lastLogout, totalMinutes, overtime, checkOutMethod)
 * - recordActivity: heartbeat — updates lastActivityAt every 5 min
 * - getMyAttendanceToday: returns current user's attendance + work schedule for live timer
 * - recordLogin: legacy auto-login (kept for backward compat)
 * - recordLogout: legacy auto-logout (kept for backward compat)
 * - getAttendanceLogs: daily logs for admin (with new fields)
 * - getAttendanceSummary: monthly summary per user (with overtime, late minutes)
 * - getWorkSchedule / updateWorkSchedule / addHoliday / removeHoliday
 * - getOrgUsers: for absent detection
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import AttendanceLog from "@/models/AttendanceLog";
import Organization from "@/models/Organization";
import User from "@/models/User";

// ─── Helper: get org schedule ─────────────────────────────────────────────────
async function getOrgSchedule(orgId: string) {
    const org = await Organization.findById(orgId).select("settings.workSchedule").lean();
    return (org as any)?.settings?.workSchedule || null;
}

// ─── Helper: calculate late minutes ───────────────────────────────────────────
function calculateLateMinutes(schedule: any): number {
    if (!schedule?.enabled || !schedule?.startTime) return 0;
    const now = new Date();
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const graceMin = schedule.gracePeriodMinutes || 0;
    const startMinutes = startH * 60 + startM + graceMin;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes > startMinutes ? currentMinutes - startMinutes : 0;
}

// ─── Helper: calculate overtime minutes ───────────────────────────────────────
function calculateOvertimeMinutes(schedule: any): number {
    if (!schedule?.enabled || !schedule?.endTime) return 0;
    const now = new Date();
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const endMinutes = endH * 60 + endM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes > endMinutes ? currentMinutes - endMinutes : 0;
}

// ─── Record Activity Heartbeat ────────────────────────────────────────────────

export async function recordActivity() {
    const session = await auth();
    if (!session?.user) return { success: false };

    try {
        await dbConnect();
        const userId = (session.user as any).id;
        const today = new Date().toISOString().split("T")[0];

        await AttendanceLog.updateOne(
            { userId, date: today },
            { $set: { lastActivityAt: new Date() } }
        );
        return { success: true };
    } catch (err) {
        console.error("recordActivity error:", err);
        return { success: false };
    }
}

// ─── Get My Attendance Today (for check-in/out widget) ────────────────────────

export async function getMyAttendanceToday() {
    const session = await auth();
    if (!session?.user) return null;

    try {
        await dbConnect();
        const userId = (session.user as any).id;
        const orgId = (session.user as any).orgId;
        const today = new Date().toISOString().split("T")[0];

        // Fetch log + schedule in parallel
        const [log, schedule] = await Promise.all([
            AttendanceLog.findOne({ userId, date: today }).lean(),
            getOrgSchedule(orgId),
        ]);

        // Always return schedule so the widget can show live timer status
        const workSchedule = schedule?.enabled ? {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            gracePeriodMinutes: schedule.gracePeriodMinutes || 0,
        } : null;

        if (!log) return { checkedIn: false, checkedOut: false, workSchedule };

        return {
            _id: (log as any)._id.toString(),
            checkedIn: true,
            firstLogin: (log as any).firstLogin?.toISOString?.() || (log as any).firstLogin,
            lastLogout: (log as any).lastLogout?.toISOString?.() || (log as any).lastLogout || null,
            checkedOut: !!(log as any).lastLogout,
            totalMinutes: (log as any).totalMinutes || null,
            lateMinutes: (log as any).lateMinutes || 0,
            overtimeMinutes: (log as any).overtimeMinutes || 0,
            autoCheckedOut: (log as any).autoCheckedOut || false,
            checkOutMethod: (log as any).checkOutMethod || null,
            status: (log as any).status,
            workSchedule,
        };
    } catch (err) {
        console.error("getMyAttendanceToday error:", err);
        return null;
    }
}

// ─── Explicit Check-In ───────────────────────────────────────────────────────

export async function checkIn() {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        await dbConnect();
        const userId = (session.user as any).id;
        const orgId = (session.user as any).orgId;
        const userName = session.user.name || "";
        const today = new Date().toISOString().split("T")[0];

        // Check if already checked in today
        const existing = await AttendanceLog.findOne({ userId, date: today });
        if (existing) {
            return {
                success: false,
                message: "Already checked in today",
                time: existing.firstLogin?.toISOString(),
            };
        }

        // Determine status + late minutes based on org schedule
        const schedule = await getOrgSchedule(orgId);
        let status: "PRESENT" | "LATE" = "PRESENT";
        let lateMinutes = 0;

        if (schedule?.enabled && schedule?.startTime) {
            lateMinutes = calculateLateMinutes(schedule);
            if (lateMinutes > 0) status = "LATE";
        }

        const now = new Date();
        await AttendanceLog.create({
            userId,
            orgId,
            userName,
            date: today,
            firstLogin: now,
            lastActivityAt: now,
            loginCount: 1,
            status,
            lateMinutes,
        });

        return {
            success: true,
            message: status === "LATE"
                ? `Checked in — ${lateMinutes} min late`
                : "Checked in successfully",
            time: now.toISOString(),
            status,
            lateMinutes,
        };
    } catch (err) {
        console.error("checkIn error:", err);
        return { success: false, message: "Failed to check in" };
    }
}

// ─── Explicit Check-Out ──────────────────────────────────────────────────────

export async function checkOut() {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        await dbConnect();
        const userId = (session.user as any).id;
        const today = new Date().toISOString().split("T")[0];
        const now = new Date();

        const log = await AttendanceLog.findOne({ userId, date: today });
        if (!log) return { success: false, message: "You haven't checked in today" };
        if (log.lastLogout) return { success: false, message: "Already checked out today" };

        log.lastLogout = now;
        log.lastActivityAt = now;
        log.checkOutMethod = "MANUAL";
        const diffMs = now.getTime() - new Date(log.firstLogin).getTime();
        log.totalMinutes = Math.round(diffMs / 60000);

        // Check early leave + overtime
        const schedule = await getOrgSchedule(log.orgId.toString());
        if (schedule?.enabled && schedule?.endTime) {
            const [endH, endM] = schedule.endTime.split(":").map(Number);
            const endMinutes = endH * 60 + endM;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            if (currentMinutes < endMinutes && log.status !== "LATE") {
                log.status = "EARLY_LEAVE";
            }

            // Calculate overtime
            if (currentMinutes > endMinutes) {
                log.overtimeMinutes = currentMinutes - endMinutes;
            }
        }

        await log.save();

        const hours = Math.floor(log.totalMinutes / 60);
        const mins = log.totalMinutes % 60;

        return {
            success: true,
            message: `Checked out — ${hours}h ${mins}m worked`,
            time: now.toISOString(),
            totalMinutes: log.totalMinutes,
            overtimeMinutes: log.overtimeMinutes || 0,
            status: log.status,
        };
    } catch (err) {
        console.error("checkOut error:", err);
        return { success: false, message: "Failed to check out" };
    }
}

// ─── Record Login (legacy — called on signIn) ────────────────────────────────

export async function recordLogin(userId: string, orgId: string, userName: string, ip?: string, ua?: string) {
    try {
        await dbConnect();
        const today = new Date().toISOString().split("T")[0];

        const schedule = await getOrgSchedule(orgId);
        let status: "PRESENT" | "LATE" = "PRESENT";
        let lateMinutes = 0;

        if (schedule?.enabled && schedule?.startTime) {
            lateMinutes = calculateLateMinutes(schedule);
            if (lateMinutes > 0) status = "LATE";
        }

        await AttendanceLog.findOneAndUpdate(
            { userId, date: today },
            {
                $setOnInsert: {
                    userId,
                    orgId,
                    userName,
                    date: today,
                    firstLogin: new Date(),
                    lastActivityAt: new Date(),
                    ipAddress: ip || "",
                    userAgent: ua || "",
                    status,
                    lateMinutes,
                },
                $inc: { loginCount: 1 },
            },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error("recordLogin error:", err);
    }
}

// ─── Record Logout (called on signOut or tab close) ──────────────────────────

export async function recordLogout(userId?: string) {
    try {
        let uid = userId;
        if (!uid) {
            const session = await auth();
            uid = (session?.user as any)?.id;
        }
        if (!uid) return;

        await dbConnect();
        const today = new Date().toISOString().split("T")[0];
        const now = new Date();

        const log = await AttendanceLog.findOne({ userId: uid, date: today });
        if (log && !log.lastLogout) {
            log.lastLogout = now;
            log.lastActivityAt = now;
            log.checkOutMethod = "BEACON";
            const diffMs = now.getTime() - new Date(log.firstLogin).getTime();
            log.totalMinutes = Math.round(diffMs / 60000);

            const schedule = await getOrgSchedule(log.orgId.toString());
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
    } catch (err) {
        console.error("recordLogout error:", err);
    }
}

// ─── Get Daily Attendance (Admin) ────────────────────────────────────────────

export async function getAttendanceLogs(date?: string) {
    const session = await auth();
    if (!session?.user) return [];

    const role = (session.user as any).role;
    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    if (role !== "ADMIN" && !isSuperAdmin) return [];

    try {
        await dbConnect();
        const orgId = (session.user as any).orgId;
        const targetDate = date || new Date().toISOString().split("T")[0];

        const logs = await AttendanceLog.find({
            orgId,
            date: targetDate,
        })
            .sort({ firstLogin: 1 })
            .lean();

        return logs.map((log: any) => ({
            _id: log._id.toString(),
            userId: log.userId.toString(),
            userName: log.userName,
            date: log.date,
            firstLogin: log.firstLogin?.toISOString(),
            lastLogout: log.lastLogout?.toISOString() || null,
            lastActivityAt: log.lastActivityAt?.toISOString() || null,
            loginCount: log.loginCount,
            totalMinutes: log.totalMinutes || null,
            lateMinutes: log.lateMinutes || 0,
            overtimeMinutes: log.overtimeMinutes || 0,
            autoCheckedOut: log.autoCheckedOut || false,
            checkOutMethod: log.checkOutMethod || null,
            status: log.status,
            ipAddress: log.ipAddress || "",
        }));
    } catch (err) {
        console.error("getAttendanceLogs error:", err);
        return [];
    }
}

// ─── Get Monthly Summary (Admin) ─────────────────────────────────────────────

export async function getAttendanceSummary(month: number, year: number) {
    const session = await auth();
    if (!session?.user) return [];

    const role = (session.user as any).role;
    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    if (role !== "ADMIN" && !isSuperAdmin) return [];

    try {
        await dbConnect();
        const orgId = (session.user as any).orgId;

        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

        const logs = await AttendanceLog.find({
            orgId,
            date: { $gte: startDate, $lte: endDate },
        })
            .sort({ date: 1 })
            .lean();

        // Group by user
        const userMap: Record<string, {
            userId: string;
            userName: string;
            totalDays: number;
            lateDays: number;
            earlyLeaveDays: number;
            totalLateMinutes: number;
            totalOvertimeMinutes: number;
            autoCheckouts: number;
            avgMinutes: number;
            logs: any[];
        }> = {};

        for (const log of logs as any[]) {
            const uid = log.userId.toString();
            if (!userMap[uid]) {
                userMap[uid] = {
                    userId: uid,
                    userName: log.userName,
                    totalDays: 0,
                    lateDays: 0,
                    earlyLeaveDays: 0,
                    totalLateMinutes: 0,
                    totalOvertimeMinutes: 0,
                    autoCheckouts: 0,
                    avgMinutes: 0,
                    logs: [],
                };
            }
            userMap[uid].totalDays++;
            if (log.status === "LATE") userMap[uid].lateDays++;
            if (log.status === "EARLY_LEAVE") userMap[uid].earlyLeaveDays++;
            userMap[uid].totalLateMinutes += log.lateMinutes || 0;
            userMap[uid].totalOvertimeMinutes += log.overtimeMinutes || 0;
            if (log.autoCheckedOut) userMap[uid].autoCheckouts++;
            userMap[uid].logs.push({
                date: log.date,
                firstLogin: log.firstLogin?.toISOString(),
                lastLogout: log.lastLogout?.toISOString() || null,
                totalMinutes: log.totalMinutes || 0,
                lateMinutes: log.lateMinutes || 0,
                overtimeMinutes: log.overtimeMinutes || 0,
                status: log.status,
                loginCount: log.loginCount,
                autoCheckedOut: log.autoCheckedOut || false,
                checkOutMethod: log.checkOutMethod || null,
            });
        }

        // Calculate averages
        for (const user of Object.values(userMap)) {
            const totalMin = user.logs.reduce((sum: number, l: any) => sum + (l.totalMinutes || 0), 0);
            user.avgMinutes = user.totalDays > 0 ? Math.round(totalMin / user.totalDays) : 0;
        }

        return Object.values(userMap);
    } catch (err) {
        console.error("getAttendanceSummary error:", err);
        return [];
    }
}

// ─── Get Work Schedule ───────────────────────────────────────────────────────

export async function getWorkSchedule() {
    const session = await auth();
    if (!session?.user) return null;

    try {
        await dbConnect();
        const orgId = (session.user as any).orgId;
        const schedule = await getOrgSchedule(orgId);
        return schedule || {
            enabled: false,
            startTime: "09:00",
            endTime: "17:00",
            gracePeriodMinutes: 15,
            workDays: [1, 2, 3, 4, 5],
            timezone: "Asia/Dubai",
        };
    } catch (err) {
        console.error("getWorkSchedule error:", err);
        return null;
    }
}

// ─── Update Work Schedule (Admin) ────────────────────────────────────────────

export async function updateWorkSchedule(data: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
    workDays: number[];
    timezone: string;
    holidays?: { date: string; name: string }[];
}) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    const role = (session.user as any).role;
    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    if (role !== "ADMIN" && !isSuperAdmin) return { success: false, message: "Forbidden" };

    try {
        await dbConnect();
        const orgId = (session.user as any).orgId;
        await Organization.findByIdAndUpdate(orgId, {
            $set: { "settings.workSchedule": data },
        });
        return { success: true };
    } catch (err) {
        console.error("updateWorkSchedule error:", err);
        return { success: false, message: "Server error" };
    }
}

// ─── Add Holiday (Admin) ─────────────────────────────────────────────────────

export async function addHoliday(holiday: { date: string; name: string }) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    const role = (session.user as any).role;
    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    if (role !== "ADMIN" && !isSuperAdmin) return { success: false, message: "Forbidden" };

    try {
        await dbConnect();
        const orgId = (session.user as any).orgId;
        await Organization.findByIdAndUpdate(orgId, {
            $addToSet: { "settings.workSchedule.holidays": holiday },
        });
        return { success: true };
    } catch (err) {
        console.error("addHoliday error:", err);
        return { success: false, message: "Server error" };
    }
}

// ─── Remove Holiday (Admin) ──────────────────────────────────────────────────

export async function removeHoliday(date: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    const role = (session.user as any).role;
    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    if (role !== "ADMIN" && !isSuperAdmin) return { success: false, message: "Forbidden" };

    try {
        await dbConnect();
        const orgId = (session.user as any).orgId;
        await Organization.findByIdAndUpdate(orgId, {
            $pull: { "settings.workSchedule.holidays": { date } },
        });
        return { success: true };
    } catch (err) {
        console.error("removeHoliday error:", err);
        return { success: false, message: "Server error" };
    }
}

// ─── Get All Org Users (for absent detection) ────────────────────────────────

export async function getOrgUsers() {
    const session = await auth();
    if (!session?.user) return [];

    const role = (session.user as any).role;
    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    if (role !== "ADMIN" && !isSuperAdmin) return [];

    try {
        await dbConnect();
        const orgId = (session.user as any).orgId;
        const users = await User.find({ orgId, active: true }).select("name role").lean();
        return users.map((u: any) => ({
            _id: u._id.toString(),
            name: u.name,
            role: u.role,
        }));
    } catch (err) {
        return [];
    }
}
