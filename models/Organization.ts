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
    isSaleStatus?: boolean;
}

export interface IOrgSource {
    key: string;
    label: string;
}

export interface IOrgProduct {
    key: string;
    label: string;
    price?: number;
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
            onLeadUpdated: boolean;
            onStatusChange: boolean;
            onLeadTransferred: boolean;
            onLeadDeleted: boolean;
            onBulkAction: boolean;
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
                    isSaleStatus: { type: Boolean, default: false },
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
                    price: { type: Number },
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
                onLeadUpdated: { type: Boolean, default: true },
                onStatusChange: { type: Boolean, default: true },
                onLeadTransferred: { type: Boolean, default: true },
                onLeadDeleted: { type: Boolean, default: true },
                onBulkAction: { type: Boolean, default: true },
            },
            workSchedule: {
                enabled: { type: Boolean, default: false },
                startTime: { type: String, default: "09:00" }, // HH:mm
                endTime: { type: String, default: "17:00" },   // HH:mm
                gracePeriodMinutes: { type: Number, default: 15 },
                workDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sun, 1=Mon...6=Sat
                timezone: { type: String, default: "Asia/Dubai" },
            },
        },
    },
    { timestamps: true }
);

OrganizationSchema.index({ active: 1 });

const Organization: Model<IOrganization> =
    models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema);

export default Organization;
