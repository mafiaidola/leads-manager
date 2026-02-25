"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import LeadNote, { NOTE_TYPES } from "@/models/LeadNote";
import User, { USER_ROLES } from "@/models/User";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import mongoose from "mongoose";
import { logAudit } from "@/lib/actions/audit";
import { AUDIT_ACTIONS, ENTITY_TYPES } from "@/models/AuditLog";
import { LEAD_FIELD_OPTIONS } from "@/lib/constants/leadFields";
import * as XLSX from "xlsx";

/**
 * Convert an uploaded file (CSV or Excel) into a CSV text string.
 * Excel files are parsed with the xlsx library and the first sheet
 * is converted to CSV so the rest of the pipeline stays unchanged.
 */
async function fileToCSVText(file: File): Promise<string> {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_csv(firstSheet);
    }
    // Default: treat as CSV/text
    return file.text();
}


/**
 * Preview a CSV file: return headers and first 5 rows.
 */
export async function previewCSVImport(formData: FormData) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) return { error: "No file uploaded" };

    try {
        const text = await fileToCSVText(file);
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const headers = parsed.meta.fields || [];
        const preview = (parsed.data as any[]).slice(0, 5);

        return { headers, preview, totalRows: (parsed.data as any[]).length };
    } catch (error) {
        console.error("CSV preview error:", error);
        return { error: "Failed to parse CSV file" };
    }
}

/**
 * Import leads with user-defined column mapping + duplicate detection.
 */
export async function importLeadsWithMapping(
    formData: FormData,
    columnMapping: Record<string, string>
) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) return { message: "No file uploaded" };

    const text = await fileToCSVText(file);

    try {
        await dbConnect();

        const users = await User.find({}).select("email _id").lean();
        const userMap = new Map(users.map((u) => [u.email, u._id]));

        let importedCount = 0;
        let skippedCount = 0;
        let duplicateCount = 0;
        const rowErrors: { row: number; name: string; reason: string; rawData: string }[] = [];

        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = parsed.data as any[];
        const headers = parsed.meta.fields || [];
        const leadsToInsert: any[] = [];
        const notesToInsert: any[] = [];

        // Collect existing emails/phones for duplicate detection
        const existingLeads = await Lead.find({ deletedAt: null })
            .select("email phone")
            .lean();
        const existingEmails = new Set(
            existingLeads.filter((l) => l.email).map((l) => l.email!.toLowerCase())
        );
        const existingPhones = new Set(
            existingLeads.filter((l) => l.phone).map((l) => l.phone!)
        );

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            // Map CSV columns to lead fields using user mapping
            const mapped: any = {};
            for (const [csvCol, leadField] of Object.entries(columnMapping)) {
                if (leadField && row[csvCol] !== undefined) {
                    mapped[leadField] = row[csvCol];
                }
            }

            // Name is required
            if (!mapped.name) {
                skippedCount++;
                rowErrors.push({ row: i + 2, name: mapped.name || "(empty)", reason: "Missing name", rawData: headers.map((h: string) => row[h] || "").join(",") });
                continue;
            }

            // Duplicate detection
            const emailLower = mapped.email?.toLowerCase();
            const phoneSanitized = mapped.phone?.replace?.(/[^0-9]/g, "");
            let dupReason = "";
            if (emailLower && existingEmails.has(emailLower)) dupReason = `Duplicate email: ${emailLower}`;
            else if (phoneSanitized && existingPhones.has(phoneSanitized)) dupReason = `Duplicate phone: ${phoneSanitized}`;
            if (dupReason) {
                duplicateCount++;
                rowErrors.push({ row: i + 2, name: mapped.name, reason: dupReason, rawData: headers.map((h: string) => row[h] || "").join(",") });
                continue;
            }

            // Track new entries to avoid intra-file duplicates
            if (emailLower) existingEmails.add(emailLower);
            if (mapped.phone) existingPhones.add(mapped.phone);

            const assignedToId = mapped.assignedToEmail
                ? userMap.get(mapped.assignedToEmail)
                : undefined;
            const tags = mapped.tags
                ? mapped.tags.split(",").map((t: string) => t.trim())
                : [];

            const leadId = new mongoose.Types.ObjectId();

            leadsToInsert.push({
                _id: leadId,
                name: mapped.name,
                email: mapped.email,
                phone: mapped.phone,
                company: mapped.company,
                position: mapped.position,
                website: mapped.website,
                source: mapped.source || "import",
                status: mapped.status || "interesting",
                product: mapped.product,
                value: mapped.value ? Number(mapped.value) : undefined,
                assignedTo: assignedToId,
                tags,
                address: {
                    addressLine: mapped.address,
                    city: mapped.city,
                    state: mapped.state,
                    zipCode: mapped.zipCode,
                    country: mapped.country || "UAE",
                },
                defaultLanguage: mapped.defaultLanguage || "System Default",
                description: mapped.description,
                createdBy: session.user.id,
                updatedBy: session.user.id,
                contactedToday: false,
                public: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            notesToInsert.push({
                leadId,
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

        logAudit(
            AUDIT_ACTIONS.IMPORT,
            ENTITY_TYPES.LEAD,
            null,
            `CSV import: ${importedCount} imported, ${skippedCount} skipped (no name), ${duplicateCount} duplicates skipped`
        );

        revalidatePath("/leads");

        // Build CSV of failed rows for download
        let errorsCsv = "";
        if (rowErrors.length > 0) {
            errorsCsv = `Row,Name,Reason\n` + rowErrors.map(e => `${e.row},"${e.name}","${e.reason}"`).join("\n");
        }

        return {
            success: true,
            message: `Imported ${importedCount} leads. Skipped ${skippedCount} (missing name). ${duplicateCount} duplicates found.`,
            importedCount,
            skippedCount,
            duplicateCount,
            errors: rowErrors.slice(0, 50), // limit to 50 for display
            errorsCsv,
        };
    } catch (error) {
        console.error("Import failed:", error);
        return { message: "Import failed due to server error." };
    }
}

/**
 * Legacy import function (kept for backward compatibility).
 */
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

        const users = await User.find({}).select("email _id").lean();
        const userMap = new Map(users.map((u) => [u.email, u._id]));

        let importedCount = 0;
        let skippedCount = 0;

        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = parsed.data as any[];
        const leadsToInsert: any[] = [];
        const notesToInsert: any[] = [];

        for (const row of rows) {
            if (!row.name) {
                skippedCount++;
                continue;
            }

            const assignedToId = row.assignedToEmail
                ? userMap.get(row.assignedToEmail)
                : undefined;
            const tags = row.tags
                ? row.tags.split(",").map((t: string) => t.trim())
                : [];

            const leadId = new mongoose.Types.ObjectId();

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
                tags,
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
                public: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            notesToInsert.push({
                leadId,
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
            skippedCount,
        };
    } catch (error) {
        console.error("Import failed:", error);
        return { message: "Import failed due to server error." };
    }
}
