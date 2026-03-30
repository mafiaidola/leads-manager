/**
 * @module models/AuditLog
 * @description Mongoose schema for compliance audit logging.
 *
 * Features:
 * - Tracks all system actions: CREATE, UPDATE, DELETE, LOGIN, IMPORT,
 *   EXPORT, TRANSFER, RESTORE, BULK_UPDATE, BULK_DELETE, PASSWORD_RESET
 * - Entity types: lead, user, organization, settings
 * - Stores `userName`, `userId`, `entityId`, `details` for full traceability
 * - Org-scoped via `orgId`
 * - Compound index on `orgId + createdAt` for efficient pagination
 * - Non-breaking: logAudit never throws to prevent side-effects
 */
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
    SUBMIT: "SUBMIT",
    APPROVE: "APPROVE",
    REJECT: "REJECT",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const ENTITY_TYPES = {
    LEAD: "lead",
    ADDITIONAL_LEAD: "additional_lead",
    USER: "user",
    SETTINGS: "settings",
    ORGANIZATION: "organization",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

export interface IAuditLog {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
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
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
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
AuditLogSchema.index({ orgId: 1, createdAt: -1 });  // Multi-tenant pagination

const AuditLog: Model<IAuditLog> =
    models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
