import mongoose, { Schema, Model, models } from "mongoose";

export const USER_ROLES = {
    ADMIN: "ADMIN",
    MARKETING: "MARKETING",
    SALES: "SALES",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface IUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.SALES,
        },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const User: Model<IUser> = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
