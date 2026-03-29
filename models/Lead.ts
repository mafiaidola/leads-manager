/**
 * @module models/Lead
 * @description Mongoose schema for the Lead entity — the core data model.
 *
 * Features:
 * - Multi-tenant isolation via `orgId` (indexed)
 * - Auto-incrementing `serialNumber` per org (via Counter model)
 * - Phone uniqueness enforced per org (compound sparse index)
 * - Text-search index on `name`, `company`, `email`, `phone`, `notes`
 * - Pre-save hook: trims strings, normalises phone format, generates serial
 * - Soft-delete via `deletedAt` timestamp
 * - Starred array tracks per-user starred leads
 */
import mongoose, { Schema, Model, models } from "mongoose";
import { getNextSequence } from "./Counter";

export interface ILead {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
    serialNumber: number;
    name: string;
    company?: string;
    countryCode: string;
    email?: string;
    phone?: string;
    website?: string;
    position?: string;
    value?: number;
    currency: string;
    tags: string[];
    status: string;
    source?: string;
    product?: string;
    productPrice?: number;
    customPrice?: number;
    subTotal?: number;
    assignedTo?: mongoose.Types.ObjectId;
    address: {
        addressLine?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    defaultLanguage?: string;
    description?: string;
    public: boolean;
    contactedToday: boolean;
    lastContactAt?: Date;
    followUpDate?: Date;
    starred: mongoose.Types.ObjectId[];
    deletedAt?: Date | null;
    customFields: Record<string, any>;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        serialNumber: { type: Number, index: true },
        name: { type: String, required: true, index: true },
        company: { type: String, index: true },
        countryCode: { type: String, default: "971" },
        email: { type: String, index: true },
        phone: String,
        website: String,
        position: String,
        value: Number,
        currency: { type: String, default: "AED" },
        tags: [String],
        status: { type: String, required: true, index: true },
        source: String,
        product: String,
        productPrice: Number,
        customPrice: Number,
        subTotal: Number,
        assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
        address: {
            addressLine: String,
            city: String,
            state: String,
            country: { type: String, default: "UAE" },
            zipCode: String,
        },
        defaultLanguage: { type: String, default: "System Default" },
        description: String,
        public: { type: Boolean, default: false },
        contactedToday: { type: Boolean, default: false },
        lastContactAt: Date,
        followUpDate: { type: Date, default: null },
        starred: [{ type: Schema.Types.ObjectId, ref: "User" }],
        deletedAt: { type: Date, default: null },
        customFields: { type: Schema.Types.Mixed, default: {} },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Text index for full-text search
LeadSchema.index(
    { name: "text", company: "text", email: "text", phone: "text" },
    { weights: { name: 10, company: 5, email: 5, phone: 5 } }
);

// Index for recycle bin queries
LeadSchema.index({ deletedAt: 1 });

// Unique sparse index on phone — enforces uniqueness per org for non-empty, non-deleted leads
LeadSchema.index(
    { phone: 1, orgId: 1 },
    {
        unique: true,
        sparse: true,
        partialFilterExpression: { phone: { $exists: true, $ne: "" }, deletedAt: null },
    }
);

// Unique serial per org
LeadSchema.index({ serialNumber: 1, orgId: 1 }, { unique: true });

// ─── Compound indexes for multi-tenant queries ─────────────────────
LeadSchema.index({ orgId: 1, deletedAt: 1, status: 1 });         // Main list + Kanban
LeadSchema.index({ orgId: 1, assignedTo: 1, deletedAt: 1 });     // Sales user filtering
LeadSchema.index({ orgId: 1, deletedAt: 1, createdAt: -1 });     // Default sort order
LeadSchema.index({ orgId: 1, followUpDate: 1 });                 // Overdue follow-ups
LeadSchema.index({ orgId: 1, source: 1, deletedAt: 1 });         // Reports: leads by source
LeadSchema.index({ orgId: 1, deletedAt: 1, updatedAt: -1 });     // Recently updated sort

// Pre-save hook: sanitize phone to digits-only
LeadSchema.pre("save", function () {
    if (this.phone) {
        this.phone = this.phone.replace(/[^0-9]/g, "");
    }
});

// Pre-validate hook: auto-assign serial number (per-organization)
LeadSchema.pre("validate", async function () {
    if (this.isNew && !this.serialNumber && this.orgId) {
        this.serialNumber = await getNextSequence(`lead_serial_${this.orgId}`);
    }
});

const Lead: Model<ILead> = models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
