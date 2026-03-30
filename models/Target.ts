/**
 * @module models/Target
 * @description Mongoose schema for monthly targets per user.
 *
 * Admin sets per-user monthly targets for:
 * - Lead count (how many leads to handle)
 * - Revenue amount (how much revenue to generate)
 *
 * Features:
 * - Org-scoped via `orgId`
 * - Unique compound index on { orgId, userId, month, year }
 * - `setBy` tracks which admin created the target
 */
import mongoose, { Schema, Model, models } from "mongoose";

export interface ITarget {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    month: number;    // 1-12
    year: number;     // e.g. 2026
    leadsTarget: number;
    revenueTarget: number;
    currency: string;
    setBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TargetSchema = new Schema<ITarget>(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        month: { type: Number, required: true, min: 1, max: 12 },
        year: { type: Number, required: true },
        leadsTarget: { type: Number, default: 0 },
        revenueTarget: { type: Number, default: 0 },
        currency: { type: String, default: "AED" },
        setBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

// Ensure one target per user per month
TargetSchema.index({ orgId: 1, userId: 1, month: 1, year: 1 }, { unique: true });

const Target: Model<ITarget> =
    models.Target || mongoose.model<ITarget>("Target", TargetSchema);

export default Target;
