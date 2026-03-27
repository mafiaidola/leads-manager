/**
 * @module lib/actions/notifications
 * @description Server actions for in-app notification management.
 *
 * Exports:
 * - `createNotification` — creates and broadcasts notification (to admins or specific user)
 * - `getUnreadNotifications` — returns unread notifications for the current user
 * - `getAllNotifications` — paginated list of all notifications
 * - `markNotificationRead` — marks a single notification as read
 * - `markAllNotificationsRead` — bulk mark-all-read
 * - `deleteAllNotifications` — remove all notifications for current user
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import User, { USER_ROLES } from "@/models/User";
import mongoose from "mongoose";

export type NotificationType =
    | "new_lead"
    | "lead_assigned"
    | "lead_updated"
    | "status_changed"
    | "lead_transferred"
    | "follow_up_due"
    | "lead_restored"
    | "lead_deleted"
    | "bulk_status_change"
    | "bulk_assignment"
    | "bulk_deleted";

// ─── Internal helper: create a notification (called from leads.ts) ───────────
export async function createNotification({
    userIds,
    type,
    title,
    message,
    leadId,
}: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    leadId?: string;
}) {
    try {
        const session = await auth();
        const orgId = session?.user?.orgId;
        await dbConnect();

        // Check org notification preferences before sending
        if (orgId) {
            const Organization = (await import("@/models/Organization")).default;
            const org = await Organization.findById(orgId)
                .select("settings.notificationPreferences")
                .lean() as any;
            const prefs = org?.settings?.notificationPreferences;
            if (prefs) {
                const prefMap: Record<string, boolean> = {
                    new_lead: prefs.onNewLead !== false,
                    lead_assigned: prefs.onAssigned !== false,
                    lead_updated: prefs.onLeadUpdated !== false,
                    status_changed: prefs.onStatusChange !== false,
                    lead_transferred: prefs.onLeadTransferred !== false,
                    lead_deleted: prefs.onLeadDeleted !== false,
                    lead_restored: prefs.onLeadDeleted !== false,
                    bulk_status_change: prefs.onBulkAction !== false,
                    bulk_assignment: prefs.onBulkAction !== false,
                    bulk_deleted: prefs.onBulkAction !== false,
                };
                // Skip notifications that are disabled by org preferences
                if (prefMap[type] === false) return;
            }
        }

        // Filter out empty/invalid userIds
        const validIds = userIds.filter(uid => uid && mongoose.Types.ObjectId.isValid(uid));
        const docs = validIds.map((uid) => ({
            orgId: orgId ? new mongoose.Types.ObjectId(orgId) : undefined,
            userId: new mongoose.Types.ObjectId(uid),
            type,
            title,
            message,
            leadId: leadId ? new mongoose.Types.ObjectId(leadId) : undefined,
            read: false,
        }));
        if (docs.length > 0) await Notification.insertMany(docs);
    } catch (err) {
        console.error("createNotification error:", err);
    }
}

// ─── Get all admin/marketing user IDs ─────────────────────────────────────────
export async function getAdminUserIds(): Promise<string[]> {
    const session = await auth();
    await dbConnect();
    // 🔒 Only include active users — deactivated admins must not receive notifications
    const filter: any = { role: { $in: [USER_ROLES.ADMIN, USER_ROLES.MARKETING] }, active: true };
    if (session?.user?.orgId) filter.orgId = session.user.orgId;
    const admins = await User.find(filter).select("_id").lean();
    return admins.map((u: any) => u._id.toString());
}

// ─── Public: get unread notifications for current user ────────────────────────
export async function getUnreadNotifications() {
    const session = await auth();
    if (!session) return { count: 0, notifications: [] };

    await dbConnect();
    const userId = (session.user as any).id;
    const notifications = await Notification.find({ userId, read: false, ...(session.user.orgId ? { orgId: session.user.orgId } : {}) })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    return {
        count: notifications.length,
        notifications: notifications.map((n: any) => ({
            _id: n._id.toString(),
            type: n.type,
            title: n.title,
            message: n.message,
            leadId: n.leadId?.toString() || null,
            read: n.read,
            createdAt: n.createdAt.toISOString(),
        })),
    };
}

// ─── Public: get all notifications (read + unread) for dropdown panel ─────────
export async function getAllNotifications() {
    const session = await auth();
    if (!session) return { count: 0, notifications: [] };

    await dbConnect();
    const userId = (session.user as any).id;
    const notifications = await Notification.find({ userId, ...(session.user.orgId ? { orgId: session.user.orgId } : {}) })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return {
        count: unreadCount,
        notifications: notifications.map((n: any) => ({
            _id: n._id.toString(),
            type: n.type,
            title: n.title,
            message: n.message,
            leadId: n.leadId?.toString() || null,
            read: n.read,
            createdAt: n.createdAt.toISOString(),
        })),
    };
}

// ─── Mark a single notification as read ───────────────────────────────────────
export async function markNotificationRead(id: string) {
    const session = await auth();
    if (!session) return;
    await dbConnect();
    const userId = (session.user as any).id;
    const filter: any = { _id: id, userId };
    if (session.user.orgId) filter.orgId = session.user.orgId;
    await Notification.updateOne(filter, { $set: { read: true } });
}

// ─── Mark all notifications as read ───────────────────────────────────────────
export async function markAllNotificationsRead() {
    const session = await auth();
    if (!session) return;
    await dbConnect();
    const userId = (session.user as any).id;
    const filter: any = { userId, read: false };
    if (session.user.orgId) filter.orgId = session.user.orgId;
    await Notification.updateMany(filter, { $set: { read: true } });
}

// ─── Delete all notifications ─────────────────────────────────────────────────
export async function deleteAllNotifications() {
    const session = await auth();
    if (!session) return;
    await dbConnect();
    const userId = (session.user as any).id;
    const filter: any = { userId };
    if (session.user.orgId) filter.orgId = session.user.orgId;
    await Notification.deleteMany(filter);
}
