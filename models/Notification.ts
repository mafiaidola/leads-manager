import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: "new_lead" | "lead_assigned" | "status_changed" | "follow_up_due" | "lead_restored" | "lead_deleted";
    title: string;
    message: string;
    leadId?: mongoose.Types.ObjectId;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: {
            type: String,
            enum: ["new_lead", "lead_assigned", "status_changed", "follow_up_due", "lead_restored", "lead_deleted"],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
        read: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete notifications older than 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);
