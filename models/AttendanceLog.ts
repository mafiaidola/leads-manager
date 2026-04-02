/**
 * @model AttendanceLog
 * @description Tracks employee attendance (login/logout) per day.
 * 
 * Design:
 * - One document per user per day (upsert pattern)
 * - firstLogin: timestamp of first login of the day (check-in)
 * - lastLogout: timestamp of last logout/tab-close (check-out)
 * - loginCount: how many times user logged in that day
 * - totalMinutes: calculated work duration (lastLogout - firstLogin)
 * - status: PRESENT | LATE | EARLY_LEAVE | ABSENT (computed from schedule)
 * 
 * Indexes:
 * - { orgId, date } for daily reports
 * - { userId, date } for individual history
 * - TTL: 365 days auto-cleanup
 */
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAttendanceLog extends Document {
    userId: Types.ObjectId;
    orgId: Types.ObjectId;
    userName: string;
    date: string; // YYYY-MM-DD format
    firstLogin: Date;
    lastLogout?: Date;
    lastActivityAt?: Date;
    loginCount: number;
    totalMinutes?: number;
    lateMinutes?: number;
    overtimeMinutes?: number;
    autoCheckedOut?: boolean;
    checkOutMethod?: "MANUAL" | "AUTO_ENDTIME" | "AUTO_INACTIVITY" | "BEACON";
    ipAddress?: string;
    userAgent?: string;
    status: "PRESENT" | "LATE" | "EARLY_LEAVE" | "ABSENT";
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceLogSchema = new Schema<IAttendanceLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        userName: { type: String, required: true },
        date: { type: String, required: true }, // YYYY-MM-DD
        firstLogin: { type: Date, required: true },
        lastLogout: { type: Date },
        lastActivityAt: { type: Date },
        loginCount: { type: Number, default: 1 },
        totalMinutes: { type: Number },
        lateMinutes: { type: Number, default: 0 },
        overtimeMinutes: { type: Number, default: 0 },
        autoCheckedOut: { type: Boolean, default: false },
        checkOutMethod: {
            type: String,
            enum: ["MANUAL", "AUTO_ENDTIME", "AUTO_INACTIVITY", "BEACON"],
        },
        ipAddress: { type: String },
        userAgent: { type: String },
        status: {
            type: String,
            enum: ["PRESENT", "LATE", "EARLY_LEAVE", "ABSENT"],
            default: "PRESENT",
        },
    },
    {
        timestamps: true,
    }
);

// Unique constraint: one record per user per day
AttendanceLogSchema.index({ userId: 1, date: 1 }, { unique: true });
// For org-wide daily reports
AttendanceLogSchema.index({ orgId: 1, date: -1 });
// TTL: auto-delete after 365 days
AttendanceLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.models.AttendanceLog ||
    mongoose.model<IAttendanceLog>("AttendanceLog", AttendanceLogSchema);
