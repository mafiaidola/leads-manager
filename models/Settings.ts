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

export interface ISettings {
    _id: mongoose.Types.ObjectId;
    statuses: IStatus[];
    sources: ISource[];
    products: IProduct[];
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
    },
    { timestamps: true }
);

const Settings: Model<ISettings> =
    models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
