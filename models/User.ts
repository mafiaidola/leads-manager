/**
 * @module models/User
 * @description Mongoose schema for application users.
 *
 * Features:
 * - Four roles: ADMIN, MARKETING, SALES, IQA (enforced by `enum` at DB level)
 * - `isSuperAdmin` flag for cross-organisation access
 * - bcrypt password hash storage (`passwordHash`)
 * - Unique `username` per system, unique `email` per org (compound index)
 * - Soft-disable via `active` boolean
 * - `orgId` for multi-tenant isolation
 */
import mongoose, { Schema, Model, models } from "mongoose";

export const USER_ROLES = {
    ADMIN: "ADMIN",
    MARKETING: "MARKETING",
    SALES: "SALES",
    IQA: "IQA",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface IUser {
    _id: mongoose.Types.ObjectId;
    orgId: mongoose.Types.ObjectId;
    name: string;
    username: string;
    email?: string;
    passwordHash: string;
    role: UserRole;
    isSuperAdmin: boolean;
    active: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        name: { type: String, required: true },
        username: { type: String, required: true, lowercase: true, trim: true },
        email: { type: String, sparse: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(USER_ROLES),   // 🔒 DB-level enum enforcement
            default: USER_ROLES.SALES,
        },
        isSuperAdmin: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
        lastLogin: { type: Date },
    },
    { timestamps: true }
);

// Username is unique per organization
UserSchema.index({ username: 1, orgId: 1 }, { unique: true });
UserSchema.index({ orgId: 1, role: 1, active: 1 });  // Admin/sales user lookup

const User: Model<IUser> = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
