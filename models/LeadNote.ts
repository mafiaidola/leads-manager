import mongoose, { Schema, Model, models } from "mongoose";
import { UserRole } from "./User";

export const NOTE_TYPES = {
    COMMENT: "COMMENT",
    STATUS_CHANGE: "STATUS_CHANGE",
    PHONE_UPDATE: "PHONE_UPDATE",
    SYSTEM: "SYSTEM",
} as const;

export type NoteType = (typeof NOTE_TYPES)[keyof typeof NOTE_TYPES];

export interface ILeadNote {
    _id: mongoose.Types.ObjectId;
    leadId: mongoose.Types.ObjectId;
    authorId?: mongoose.Types.ObjectId; // System messages might not have an author
    authorRole?: UserRole | "SYSTEM";
    type: NoteType;
    message: string;
    meta?: {
        fromStatus?: string;
        toStatus?: string;
        oldPhone?: string;
        newPhone?: string;
    };
    createdAt: Date;
}

const LeadNoteSchema = new Schema<ILeadNote>(
    {
        leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
        authorId: { type: Schema.Types.ObjectId, ref: "User" },
        authorRole: String,
        type: {
            type: String,
            enum: Object.values(NOTE_TYPES),
            required: true,
        },
        message: { type: String, required: true },
        meta: {
            fromStatus: String,
            toStatus: String,
            oldPhone: String,
            newPhone: String,
        },
    },
    { timestamps: true } // adds createdAt and updatedAt
);

const LeadNote: Model<ILeadNote> =
    models.LeadNote || mongoose.model<ILeadNote>("LeadNote", LeadNoteSchema);

export default LeadNote;
