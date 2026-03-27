/**
 * @module models/Notification
 * @description Mongoose schema for in-app user notifications.
 *
 * Features:
 * - Org-scoped via `orgId`
 * - User-targeted via `userId`
 * - 11 notification types covering all lead lifecycle events
 * - Optional `leadId` reference for deep-linking
 * - `read` boolean for unread badge count
 * - Feeds the real-time SSE notification stream
 */
import mongoose, { Schema, Document } from "mongoose";

export const NOTIFICATION_TYPES = [
    "new_lead",
    "lead_assigned",
    "lead_updated",
    "status_changed",
    "lead_transferred",
    "follow_up_due",
    "lead_restored",
    "lead_deleted",
    "bulk_status_change",
    "bulk_assignment",
    "bulk_deleted",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
    orgId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    leadId?: mongoose.Types.ObjectId;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: {
            type: String,
            enum: NOTIFICATION_TYPES,
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
        read: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete notifications older than 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
NotificationSchema.index({ userId: 1, orgId: 1, read: 1 });  // Unread notifications

export default mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);
