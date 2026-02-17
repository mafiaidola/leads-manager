import mongoose, { Schema, Model, models } from "mongoose";

export interface IStatus {
    key: string;
    label: string;
    color: string;
}

export interface ISource {
    key: string;
    label: string;
}

export interface IProduct {
    key: string;
    label: string;
}

export interface ICustomField {
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select";
    options?: string[]; // For select type
}

export interface ICustomRole {
    name: string;
    permissions: string[];
}

export interface IBranding {
    appName: string;
    accentColor: string;
    logoUrl: string;
}

export interface IGoals {
    monthlyLeadTarget: number;
    monthlyConversionTarget: number;
}

export interface ISettings {
    _id: mongoose.Types.ObjectId;
    statuses: IStatus[];
    sources: ISource[];
    products: IProduct[];
    customFields: ICustomField[];
    customRoles: ICustomRole[];
    branding: IBranding;
    goals: IGoals;
}

const SettingsSchema = new Schema<ISettings>(
    {
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
        branding: {
            appName: { type: String, default: "Leads Mgr" },
            accentColor: { type: String, default: "#8b5cf6" },
            logoUrl: { type: String, default: "" },
        },
        goals: {
            monthlyLeadTarget: { type: Number, default: 50 },
            monthlyConversionTarget: { type: Number, default: 10 },
        },
    },
    { timestamps: true }
);

const Settings: Model<ISettings> =
    models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
