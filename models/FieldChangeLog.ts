/**
 * @module models/FieldChangeLog
 * @description Mongoose schema for field-level change tracking on leads.
 * Records who changed which field, old value, new value, and when.
 * Visible only to Admin and SuperAdmin in lead detail view.
 */
import mongoose, { Schema, Model, models } from "mongoose";

export interface IFieldChangeLog {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
    leadId: mongoose.Types.ObjectId;
    field: string;
    oldValue: string;
    newValue: string;
    changedBy: mongoose.Types.ObjectId;
    changedByName: string;
    createdAt: Date;
}

const FieldChangeLogSchema = new Schema<IFieldChangeLog>(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
        field: { type: String, required: true },
        oldValue: { type: String, default: "" },
        newValue: { type: String, default: "" },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        changedByName: { type: String, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Efficient lookup: all changes for a specific lead
FieldChangeLogSchema.index({ leadId: 1, createdAt: -1 });
// Auto-delete after 180 days
FieldChangeLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

const FieldChangeLog: Model<IFieldChangeLog> =
    models.FieldChangeLog || mongoose.model<IFieldChangeLog>("FieldChangeLog", FieldChangeLogSchema);

export default FieldChangeLog;
