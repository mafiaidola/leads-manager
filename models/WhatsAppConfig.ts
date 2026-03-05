/**
 * @module models/WhatsAppConfig
 * @description Mongoose schema for WhatsApp Business API configuration per org.
 *
 * Features:
 * - Stores Meta API credentials: `accessToken`, `phoneNumberId`, `wabaId`
 * - `displayPhone` for human-readable phone display
 * - `connected` boolean + `connectedAt` timestamp
 * - Org-scoped via `orgId` (indexed), user-scoped via `userId`
 * - Created during the OAuth callback flow (/api/whatsapp/callback)
 */
import mongoose, { Schema, Model, models } from "mongoose";

export interface IWhatsAppConfig {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
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
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
