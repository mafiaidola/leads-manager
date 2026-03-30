/**
 * @module lib/actions/targets
 * @description Server actions for managing monthly targets.
 *
 * Exports:
 * - `setTarget` — Admin sets target for a user
 * - `getTargets` — Get targets for a month/year (admin: all, user: own)
 * - `getTargetProgress` — Calculate real-time progress against target
 * - `copyLastMonthTargets` — Copy all targets from previous month
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Target from "@/models/Target";
import Lead from "@/models/Lead";
import Organization from "@/models/Organization";
import { USER_ROLES } from "@/models/User";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

// ─── Set Target (Admin only) ─────────────────────────────────────────────────
export async function setTarget(data: {
    userId: string;
    month: number;
    year: number;
    leadsTarget: number;
    revenueTarget: number;
}) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Only admins can set targets", success: false };
    }

    try {
        await dbConnect();
        const orgId = session.user.orgId;

        await Target.findOneAndUpdate(
            {
                orgId: new mongoose.Types.ObjectId(orgId as string),
                userId: new mongoose.Types.ObjectId(data.userId),
                month: data.month,
                year: data.year,
            },
            {
                leadsTarget: data.leadsTarget,
                revenueTarget: data.revenueTarget,
                setBy: new mongoose.Types.ObjectId(session.user.id),
            },
            { upsert: true, new: true }
        );

        revalidatePath("/settings");
        revalidatePath("/");
        return { message: "Target set successfully", success: true };
    } catch (error) {
        console.error("setTarget error:", error);
        return { message: "Failed to set target", success: false };
    }
}

// ─── Get Targets for a month ─────────────────────────────────────────────────
export async function getTargets(month?: number, year?: number) {
    const session = await auth();
    if (!session) return [];

    try {
        await dbConnect();
        const orgId = session.user.orgId;
        const isAdmin = session.user.role === USER_ROLES.ADMIN;
        const now = new Date();
        const m = month ?? now.getMonth() + 1;
        const y = year ?? now.getFullYear();

        const query: any = {
            orgId: new mongoose.Types.ObjectId(orgId as string),
            month: m,
            year: y,
        };

        if (!isAdmin) {
            query.userId = new mongoose.Types.ObjectId(session.user.id);
        }

        const targets = await Target.find(query)
            .populate("userId", "name username role")
            .populate("setBy", "name")
            .sort({ "userId.name": 1 })
            .lean();

        return JSON.parse(JSON.stringify(targets));
    } catch (error) {
        console.error("getTargets error:", error);
        return [];
    }
}

// ─── Get Target Progress ─────────────────────────────────────────────────────
export async function getTargetProgress(userId?: string) {
    const session = await auth();
    if (!session) return null;

    try {
        await dbConnect();
        const orgId = new mongoose.Types.ObjectId(session.user.orgId as string);
        const uid = userId
            ? new mongoose.Types.ObjectId(userId)
            : new mongoose.Types.ObjectId(session.user.id);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const startOfMonth = new Date(year, month - 1, 1);

        // Get org settings
        const org = await Organization.findById(session.user.orgId)
            .select("settings.statuses settings.defaultCurrency")
            .lean() as any;
        const saleStatusKeys: string[] = (org?.settings?.statuses || [])
            .filter((s: any) => s.isSaleStatus)
            .map((s: any) => s.key);
        const defaultCurrency = org?.settings?.defaultCurrency || "AED";

        const [target, leadsCount, revenueAgg] = await Promise.all([
            Target.findOne({ orgId, userId: uid, month, year }).lean(),
            // Count leads assigned to this user this month
            Lead.countDocuments({
                orgId,
                assignedTo: uid,
                deletedAt: null,
                createdAt: { $gte: startOfMonth },
            }),
            // Revenue from sale-status leads this month
            Lead.aggregate([
                {
                    $match: {
                        orgId,
                        assignedTo: uid,
                        deletedAt: null,
                        createdAt: { $gte: startOfMonth },
                        ...(saleStatusKeys.length > 0
                            ? { status: { $in: saleStatusKeys } }
                            : { status: { $regex: /customer|won|order/i } }),
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $ifNull: ["$customPrice", { $ifNull: ["$productPrice", 0] }] } },
                    }
                }
            ]),
        ]);

        const revenue = revenueAgg[0]?.total || 0;
        const leadsTarget = target?.leadsTarget || 0;
        const revenueTarget = target?.revenueTarget || 0;

        return {
            month,
            year,
            currency: defaultCurrency,
            leads: {
                current: leadsCount,
                target: leadsTarget,
                percent: leadsTarget > 0 ? Math.min(100, Math.round((leadsCount / leadsTarget) * 100)) : 0,
            },
            revenue: {
                current: revenue,
                target: revenueTarget,
                percent: revenueTarget > 0 ? Math.min(100, Math.round((revenue / revenueTarget) * 100)) : 0,
            },
            hasTarget: !!target,
        };
    } catch (error) {
        console.error("getTargetProgress error:", error);
        return null;
    }
}

// ─── Copy Last Month's Targets ───────────────────────────────────────────────
export async function copyLastMonthTargets() {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Only admins can copy targets", success: false };
    }

    try {
        await dbConnect();
        const orgId = new mongoose.Types.ObjectId(session.user.orgId as string);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Calculate previous month
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth < 1) {
            prevMonth = 12;
            prevYear -= 1;
        }

        const lastMonthTargets = await Target.find({
            orgId,
            month: prevMonth,
            year: prevYear,
        }).lean();

        if (lastMonthTargets.length === 0) {
            return { message: "No targets found for last month", success: false };
        }

        let created = 0;
        for (const t of lastMonthTargets) {
            await Target.findOneAndUpdate(
                { orgId, userId: t.userId, month: currentMonth, year: currentYear },
                {
                    leadsTarget: t.leadsTarget,
                    revenueTarget: t.revenueTarget,
                    currency: t.currency,
                    setBy: new mongoose.Types.ObjectId(session.user.id),
                },
                { upsert: true }
            );
            created++;
        }

        revalidatePath("/settings");
        revalidatePath("/");
        return { message: `Copied ${created} targets from last month`, success: true };
    } catch (error) {
        console.error("copyLastMonthTargets error:", error);
        return { message: "Failed to copy targets", success: false };
    }
}
