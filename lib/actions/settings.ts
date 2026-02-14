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
        }
        await settings.save();
        revalidatePath("/");
        return { message: "Settings updated" };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { message: "Failed to update settings" };
    }
}
