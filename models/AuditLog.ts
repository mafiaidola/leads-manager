import mongoose, { Schema, Model, models } from "mongoose";

export const AUDIT_ACTIONS = {
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
    LOGIN: "LOGIN",
    IMPORT: "IMPORT",
    EXPORT: "EXPORT",
    TRANSFER: "TRANSFER",
    RESTORE: "RESTORE",
    BULK_UPDATE: "BULK_UPDATE",
    BULK_DELETE: "BULK_DELETE",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const ENTITY_TYPES = {
    LEAD: "lead",
    USER: "user",
    SETTINGS: "settings",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

export interface IAuditLog {
    _id: mongoose.Types.ObjectId;
    action: AuditAction;
    entityType: EntityType;
    entityId?: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    details: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true },
        entityType: { type: String, enum: Object.values(ENTITY_TYPES), required: true },
        entityId: String,
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true },
        details: { type: String, required: true },
    },
    { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, action: 1 });

const AuditLog: Model<IAuditLog> =
    models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
