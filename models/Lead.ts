import mongoose, { Schema, Model, models } from "mongoose";

export interface ILead {
    _id: mongoose.Types.ObjectId;
    name: string;
    company?: string;
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
        name: { type: String, required: true, index: true },
        company: { type: String, index: true },
        email: { type: String, index: true },
        phone: { type: String, index: true },
        website: String,
        position: String,
        value: Number,
        currency: { type: String, default: "AED" },
        tags: [String],
        status: { type: String, required: true, index: true },
        source: String,
        product: String,
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

const Lead: Model<ILead> = models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
