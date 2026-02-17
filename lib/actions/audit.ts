"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import AuditLog, { AuditAction, EntityType, AUDIT_ACTIONS } from "@/models/AuditLog";
import { USER_ROLES } from "@/models/User";

/**
 * Log an audit entry. Call this from any server action to track user activity.
 */
export async function logAudit(
    action: AuditAction,
    entityType: EntityType,
    entityId: string | null,
    details: string
) {
    try {
        const session = await auth();
        if (!session) return;

        await dbConnect();
        await AuditLog.create({
            action,
            entityType,
            entityId: entityId || undefined,
            userId: session.user.id,
            userName: session.user.name || session.user.email || "Unknown",
            details,
        });
    } catch (error) {
        // Audit logging should never break the main flow
        console.error("Audit log error:", error);
    }
}

/**
 * Get paginated audit logs (admin only).
 */
export async function getAuditLogs(params: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    search?: string;
}) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { logs: [], total: 0 };
    }

    try {
        await dbConnect();

        const page = params.page || 1;
        const limit = params.limit || 25;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (params.entityType) filter.entityType = params.entityType;
        if (params.action) filter.action = params.action;
        if (params.search) {
            const searchRegex = { $regex: params.search, $options: "i" };
            filter.$or = [
                { userName: searchRegex },
                { details: searchRegex },
            ];
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter),
        ]);

        return {
            logs: logs.map((log) => ({
                _id: log._id.toString(),
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId || null,
                userId: log.userId.toString(),
                userName: log.userName,
                details: log.details,
                createdAt: log.createdAt.toISOString(),
            })),
            total,
        };
    } catch (error) {
        console.error("getAuditLogs error:", error);
        return { logs: [], total: 0 };
    }
}
