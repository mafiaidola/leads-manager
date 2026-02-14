"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote, { NOTE_TYPES } from "@/models/LeadNote";
import User, { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

export async function importLeads(formData: FormData) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) {
        return { message: "No file uploaded" };
    }

    const text = await file.text();

    try {
        await dbConnect();

        // Pre-fetch users for assignment mapping
        const users = await User.find({}).select("email _id").lean();
        const userMap = new Map(users.map(u => [u.email, u._id]));

        let importedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
        });

        const rows = parsed.data as any[];
        const leadsToInsert: any[] = [];
        const notesToInsert: any[] = [];

        for (const row of rows) {
            // Basic Validation
            if (!row.name) {
                skippedCount++;
                continue;
            }

            const assignedToId = row.assignedToEmail ? userMap.get(row.assignedToEmail) : undefined;
            const tags = row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [];

            const leadId = new (require("mongoose").Types.ObjectId)();

            leadsToInsert.push({
                _id: leadId,
                name: row.name,
                email: row.email,
                phone: row.phone,
                company: row.company,
                position: row.position,
                website: row.website,
                source: row.source || "import",
                status: row.status || "interesting",
                product: row.product,
                assignedTo: assignedToId,
                tags: tags,
                address: {
                    addressLine: row.address,
                    city: row.city,
                    state: row.state,
                    zipCode: row.zipCode,
                    country: row.country || "UAE",
                },
                defaultLanguage: row.defaultLanguage || "System Default",
                createdBy: session.user.id,
                updatedBy: session.user.id,
                contactedToday: false,
                public: row.public?.toLowerCase() === "true" || row.public === "off" ? false : !!row.public, // Handle various boolean formats
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            notesToInsert.push({
                leadId: leadId,
                type: NOTE_TYPES.SYSTEM,
                message: "Imported via CSV",
                authorRole: "SYSTEM",
                createdAt: new Date(),
            });

            importedCount++;
        }

        if (leadsToInsert.length > 0) {
            await Lead.insertMany(leadsToInsert);
            await LeadNote.insertMany(notesToInsert);
        }

        revalidatePath("/leads");
        return {
            success: true,
            message: `Imported ${importedCount} leads. Skipped ${skippedCount}.`,
            importedCount,
            skippedCount
        };

    } catch (error) {
        console.error("Import failed:", error);
        return { message: "Import failed due to server error." };
    }
}
