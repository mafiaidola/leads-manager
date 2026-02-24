"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";
import mongoose from "mongoose";

export type NotificationType =
    | "new_lead"
    | "lead_assigned"
    | "status_changed"
    | "follow_up_due"
    | "lead_restored"
    | "lead_deleted";

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
        await dbConnect();
        const docs = userIds.map((uid) => ({
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
    await dbConnect();
    const admins = await User.find({ role: { $in: ["admin", "marketing"] } }).select("_id").lean();
    return admins.map((u: any) => u._id.toString());
}

// ─── Public: get unread notifications for current user ────────────────────────
export async function getUnreadNotifications() {
    const session = await auth();
    if (!session) return { count: 0, notifications: [] };

    await dbConnect();
    const userId = (session.user as any).id;
    const notifications = await Notification.find({ userId, read: false })
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
    const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(30)
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
    await Notification.updateOne(
        { _id: id, userId },
        { $set: { read: true } }
    );
}

// ─── Mark all notifications as read ───────────────────────────────────────────
export async function markAllNotificationsRead() {
    const session = await auth();
    if (!session) return;
    await dbConnect();
    const userId = (session.user as any).id;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
}
