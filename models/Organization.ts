/**
 * @module models/Organization
 * @description Mongoose schema for tenants (organisations).
 *
 * Features:
 * - Unique `slug` index for URL-safe identification
 * - Nested `settings` sub-schema: statuses, sources, products, custom fields, goals
 * - Nested `branding` sub-schema: appName, logoUrl, accentColor
 * - Nested `theme` sub-schema: mode (light/dark/system), colours
 * - `active` boolean for suspend/resume functionality
 * - Timestamps for creation and modification tracking
 */
import mongoose, { Schema, Model, models } from "mongoose";

export interface IOrgStatus {
    key: string;
    label: string;
    color: string;
}

export interface IOrgSource {
    key: string;
    label: string;
}

export interface IOrgProduct {
    key: string;
    label: string;
}

export interface IOrgCustomField {
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select";
    options?: string[];
}

export interface IOrgCustomRole {
    name: string;
    permissions: string[];
}

export interface IOrgGoals {
    monthlyLeadTarget: number;
    monthlyConversionTarget: number;
}

export interface IOrgBranding {
    appName: string;
    accentColor: string;
    logoUrl: string;
    loginTheme: string;
}

export interface IOrganization {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    active: boolean;
    description: string;
    contactEmail: string;
    contactPhone: string;
    branding: IOrgBranding;
    theme: "violet" | "ocean" | "emerald";
    settings: {
        statuses: IOrgStatus[];
        sources: IOrgSource[];
        products: IOrgProduct[];
        customFields: IOrgCustomField[];
        customRoles: IOrgCustomRole[];
        goals: IOrgGoals;
        defaultCurrency: string;
        autoAssignStrategy: "round_robin" | "least_loaded" | "none";
        notificationPreferences: {
            onNewLead: boolean;
            onAssigned: boolean;
            onStatusChange: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        active: { type: Boolean, default: true },
        description: { type: String, default: "" },
        contactEmail: { type: String, default: "" },
        contactPhone: { type: String, default: "" },
        branding: {
            appName: { type: String, default: "Leads Mgr" },
            accentColor: { type: String, default: "#8b5cf6" },
            logoUrl: { type: String, default: "" },
            loginTheme: { type: String, default: "aurora" },
        },
        theme: { type: String, enum: ["violet", "ocean", "emerald"], default: "violet" },
        settings: {
            statuses: [
                {
                    key: { type: String, required: true },
                    label: { type: String, required: true },
                    color: { type: String, default: "gray" },
                },
            ],
            sources: [
                {
                    key: { type: String, required: true },
                    label: { type: String, required: true },
                },
            ],
            products: [
                {
                    key: { type: String, required: true },
                    label: { type: String, required: true },
                },
            ],
            customFields: [
                {
                    key: { type: String, required: true },
                    label: { type: String, required: true },
                    type: { type: String, enum: ["text", "number", "date", "select"], default: "text" },
                    options: [String],
                },
            ],
            customRoles: [
                {
                    name: { type: String, required: true },
                    permissions: [String],
                },
            ],
            goals: {
                monthlyLeadTarget: { type: Number, default: 50 },
                monthlyConversionTarget: { type: Number, default: 10 },
            },
            defaultCurrency: { type: String, default: "AED" },
            autoAssignStrategy: { type: String, enum: ["round_robin", "least_loaded", "none"], default: "none" },
            notificationPreferences: {
                onNewLead: { type: Boolean, default: true },
                onAssigned: { type: Boolean, default: true },
                onStatusChange: { type: Boolean, default: false },
            },
        },
    },
    { timestamps: true }
);

OrganizationSchema.index({ active: 1 });

const Organization: Model<IOrganization> =
    models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema);

export default Organization;
