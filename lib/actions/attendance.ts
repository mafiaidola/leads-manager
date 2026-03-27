/**
 * @module lib/actions/attendance
 * @description Server actions for attendance tracking.
 *
 * - recordLogin: logs first login of the day (upsert pattern)
 * - recordLogout: updates lastLogout timestamp
 * - getAttendanceLogs: paginated daily logs for admin
 * - getAttendanceSummary: monthly summary per user
 * - getWorkSchedule: get org work schedule settings
 * - updateWorkSchedule: admin updates work schedule
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import AttendanceLog from "@/models/AttendanceLog";
import Organization from "@/models/Organization";
import User from "@/models/User";

// ─── Record Login (called on signIn) ──────────────────────────────────────────

export async function recordLogin(userId: string, orgId: string, userName: string, ip?: string, ua?: string) {
    try {
        await dbConnect();
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        // Determine attendance status based on org schedule
        let status: "PRESENT" | "LATE" = "PRESENT";
        const org = await Organization.findById(orgId).select("settings.workSchedule").lean();
        const schedule = (org as any)?.settings?.workSchedule;

        if (schedule?.enabled && schedule?.startTime) {
            const now = new Date();
            const [startH, startM] = schedule.startTime.split(":").map(Number);
            const graceMin = schedule.gracePeriodMinutes || 0;
            const startMinutes = startH * 60 + startM + graceMin;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            if (currentMinutes > startMinutes) {
                status = "LATE";
            }
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
                    ipAddress: ip || "",
                    userAgent: ua || "",
                    status,
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
        if (log) {
            log.lastLogout = now;
            // Calculate total minutes worked
            const diffMs = now.getTime() - new Date(log.firstLogin).getTime();
            log.totalMinutes = Math.round(diffMs / 60000);

            // Check early leave
            const org = await Organization.findById(log.orgId).select("settings.workSchedule").lean();
            const schedule = (org as any)?.settings?.workSchedule;
            if (schedule?.enabled && schedule?.endTime) {
                const [endH, endM] = schedule.endTime.split(":").map(Number);
                const endMinutes = endH * 60 + endM;
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                if (currentMinutes < endMinutes && log.status !== "LATE") {
                    log.status = "EARLY_LEAVE";
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
            loginCount: log.loginCount,
            totalMinutes: log.totalMinutes || null,
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

        // Build date range YYYY-MM-01 to YYYY-MM-31
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
                    avgMinutes: 0,
                    logs: [],
                };
            }
            userMap[uid].totalDays++;
            if (log.status === "LATE") userMap[uid].lateDays++;
            if (log.status === "EARLY_LEAVE") userMap[uid].earlyLeaveDays++;
            userMap[uid].logs.push({
                date: log.date,
                firstLogin: log.firstLogin?.toISOString(),
                lastLogout: log.lastLogout?.toISOString() || null,
                totalMinutes: log.totalMinutes || 0,
                status: log.status,
                loginCount: log.loginCount,
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
        const org = await Organization.findById(orgId).select("settings.workSchedule").lean();
        return (org as any)?.settings?.workSchedule || {
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
            $set: {
                "settings.workSchedule": data,
            },
        });
        return { success: true };
    } catch (err) {
        console.error("updateWorkSchedule error:", err);
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
