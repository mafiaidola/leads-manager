"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Settings, { ISettings } from "@/models/Settings";
import { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";

export async function getSettings() {
    await dbConnect();
    const settings = await Settings.findOne().lean();
    if (!settings) return null;
    return {
        ...settings,
        _id: settings._id.toString(),
    };
}

export async function updateSettings(data: Partial<ISettings>) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(data);
        } else {
            if (data.statuses) settings.statuses = data.statuses;
            if (data.sources) settings.sources = data.sources;
            if (data.products) settings.products = data.products;
            if (data.customFields) settings.customFields = data.customFields;
            if (data.customRoles) settings.customRoles = data.customRoles;
        }
        await settings.save();
        revalidatePath("/");
        return { message: "Settings updated" };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { message: "Failed to update settings" };
    }
}

export async function updateBranding(branding: { appName: string; accentColor: string; logoUrl: string }) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ branding });
        } else {
            settings.branding = { ...settings.branding, ...branding };
        }
        await settings.save();
        revalidatePath("/");
        return { message: "Branding updated", success: true };
    } catch (error) {
        console.error("Failed to update branding:", error);
        return { message: "Failed to update branding" };
    }
}

export async function updateGoals(goals: { monthlyLeadTarget: number; monthlyConversionTarget: number }) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ goals });
        } else {
            settings.goals = { ...settings.goals, ...goals };
        }
        await settings.save();
        revalidatePath("/");
        return { message: "Goals updated", success: true };
    } catch (error) {
        console.error("Failed to update goals:", error);
        return { message: "Failed to update goals" };
    }
}
