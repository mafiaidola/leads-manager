/**
 * @module models/AdditionalLead
 * @description Mongoose schema for user-owned "Additional Leads."
 *
 * Features:
 * - Same core fields as Lead (name, phone, email, status, source, etc.)
 * - `ownerId` — the user who created this personal lead
 * - Submission workflow: draft → pending → approved/rejected
 * - Admin review with notes
 * - `convertedLeadId` links to real Lead after approval
 * - Soft-delete via `deletedAt`
 * - Auto-incrementing serial per org
 */
import mongoose, { Schema, Model, models } from "mongoose";
import { getNextSequence } from "./Counter";

export const SUBMISSION_STATUSES = ["draft", "pending", "approved", "rejected"] as const;
export type SubmissionStatus = typeof SUBMISSION_STATUSES[number];

export interface IAdditionalLead {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
    ownerId: mongoose.Types.ObjectId;
    serialNumber: number;

    // Core lead fields (same as Lead)
    name: string;
    email?: string;
    phone?: string;
    countryCode: string;
    status: string;
    source?: string;
    product?: string;
    value?: number;
    currency: string;
    description?: string;

    // Submission workflow
    submissionStatus: SubmissionStatus;
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewNotes?: string;
    convertedLeadId?: mongoose.Types.ObjectId;

    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const AdditionalLeadSchema = new Schema<IAdditionalLead>(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        serialNumber: { type: Number, index: true },

        name: { type: String, required: true },
        email: String,
        phone: String,
        countryCode: { type: String, default: "971" },
        status: { type: String, required: true },
        source: String,
        product: String,
        value: Number,
        currency: { type: String, default: "AED" },
        description: String,

        submissionStatus: {
            type: String,
            enum: SUBMISSION_STATUSES,
            default: "draft",
            index: true,
        },
        submittedAt: Date,
        reviewedAt: Date,
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reviewNotes: String,
        convertedLeadId: { type: Schema.Types.ObjectId, ref: "Lead" },

        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Indexes
AdditionalLeadSchema.index({ orgId: 1, ownerId: 1, deletedAt: 1 });
AdditionalLeadSchema.index({ orgId: 1, submissionStatus: 1 });
AdditionalLeadSchema.index({ serialNumber: 1, orgId: 1 }, { unique: true });

// Pre-save: sanitize phone
AdditionalLeadSchema.pre("save", function () {
    if (this.phone) {
        this.phone = this.phone.replace(/[^0-9]/g, "");
    }
});

// Pre-validate: auto serial number
AdditionalLeadSchema.pre("validate", async function () {
    if (this.isNew && !this.serialNumber && this.orgId) {
        this.serialNumber = await getNextSequence(`additional_lead_serial_${this.orgId}`);
    }
});

const AdditionalLead: Model<IAdditionalLead> =
    models.AdditionalLead || mongoose.model<IAdditionalLead>("AdditionalLead", AdditionalLeadSchema);

export default AdditionalLead;
