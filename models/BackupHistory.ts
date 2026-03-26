/**
 * @module models/BackupHistory
 * @description Mongoose schema for tracking automated backup history.
 * Records each backup's timestamp, size, download URL, and status.
 */
import mongoose, { Schema, Model, models } from "mongoose";

export interface IBackupHistory {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
    orgName: string;
    fileName: string;
    fileSize: number; // bytes
    downloadUrl?: string;
    status: "completed" | "failed";
    error?: string;
    triggeredBy: "cron" | "manual";
    createdAt: Date;
}

const BackupHistorySchema = new Schema<IBackupHistory>(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        orgName: { type: String, required: true },
        fileName: { type: String, required: true },
        fileSize: { type: Number, default: 0 },
        downloadUrl: String,
        status: { type: String, enum: ["completed", "failed"], required: true },
        error: String,
        triggeredBy: { type: String, enum: ["cron", "manual"], default: "manual" },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete after 90 days
BackupHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
BackupHistorySchema.index({ orgId: 1, createdAt: -1 });

const BackupHistory: Model<IBackupHistory> =
    models.BackupHistory || mongoose.model<IBackupHistory>("BackupHistory", BackupHistorySchema);

export default BackupHistory;
