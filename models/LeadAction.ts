/**
 * @module models/LeadAction
 * @description Mongoose schema for scheduled lead actions (follow-ups, calls, etc.).
 *
 * Features:
 * - Types: call, whatsapp, email, meeting, follow_up, other
 * - Org-scoped via `orgId`, linked to lead via `leadId`
 * - `scheduledAt` for future scheduling, `completedAt` for resolution tracking
 * - `createdBy` references the authoring user
 * - Compound index on `{ leadId, createdAt: -1 }` for timeline queries
 */
import mongoose, { Schema, Model, models } from "mongoose";

export const ACTION_TYPES = {
    CALL: "CALL",
    MEETING: "MEETING",
    EMAIL: "EMAIL",
    FOLLOW_UP: "FOLLOW_UP",
    WHATSAPP: "WHATSAPP",
    OTHER: "OTHER",
} as const;

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];

export interface ILeadAction {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
    leadId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    type: ActionType;
    description: string;
    outcome?: string;
    scheduledAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LeadActionSchema = new Schema<ILeadAction>(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: Object.values(ACTION_TYPES),
            required: true,
        },
        description: { type: String, required: true },
        outcome: String,
        scheduledAt: Date,
        completedAt: Date,
    },
    { timestamps: true }
);

// ─── Compound indexes ──────────────────────────────────────────────
LeadActionSchema.index({ leadId: 1, createdAt: -1 });  // Timeline queries

const LeadAction: Model<ILeadAction> =
    models.LeadAction || mongoose.model<ILeadAction>("LeadAction", LeadActionSchema);

export default LeadAction;
