import mongoose, { Schema, Model, models } from "mongoose";

export interface IWhatsAppConfig {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    accessToken: string;
    phoneNumberId: string;
    wabaId: string;
    displayPhone: string;
    connected: boolean;
    connectedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WhatsAppConfigSchema = new Schema<IWhatsAppConfig>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        accessToken: { type: String, required: true },
        phoneNumberId: { type: String, required: true },
        wabaId: { type: String, required: true },
        displayPhone: { type: String, default: "" },
        connected: { type: Boolean, default: true },
        connectedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const WhatsAppConfig: Model<IWhatsAppConfig> =
    models.WhatsAppConfig || mongoose.model<IWhatsAppConfig>("WhatsAppConfig", WhatsAppConfigSchema);

export default WhatsAppConfig;
