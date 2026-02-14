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

const LeadAction: Model<ILeadAction> =
    models.LeadAction || mongoose.model<ILeadAction>("LeadAction", LeadActionSchema);

export default LeadAction;
