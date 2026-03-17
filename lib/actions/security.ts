/**
 * @server-action getSecurityStats
 * @module lib/actions/security
 * @description Server actions for the Security tab (SuperAdmin only).
 * Returns per-user last login data and recent audit events.
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

export async function getSecurityStats() {
    const session = await auth();
    if (!(session?.user as any)?.isSuperAdmin) {
        return { users: [], recentEvents: [] };
    }

    try {
        await dbConnect();

        // Users with org name and last login
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "organizations",
                    localField: "orgId",
                    foreignField: "_id",
                    as: "org",
                    pipeline: [{ $project: { name: 1 } }],
                },
            },
            { $unwind: { path: "$org", preserveNullAndEmptyArrays: true } },
            { $project: { passwordHash: 0 } },
            { $sort: { lastLogin: -1 } },
        ]);

        // Recent audit events (last 30)
        const recentEvents = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        return {
            users: users.map((u: any) => ({
                _id: u._id.toString(),
                name: u.name,
                username: u.username || "",
                role: u.role,
                active: u.active,
                isSuperAdmin: u.isSuperAdmin || false,
                orgName: u.org?.name || "Unknown",
                lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : null,
                createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : "",
            })),
            recentEvents: recentEvents.map((e: any) => ({
                _id: e._id.toString(),
                action: e.action,
                entityType: e.entityType,
                userName: e.userName,
                details: e.details,
                createdAt: e.createdAt.toISOString(),
            })),
        };
    } catch (err) {
        console.error("getSecurityStats error:", err);
        return { users: [], recentEvents: [] };
    }
}
