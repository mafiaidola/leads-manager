/**
 * @module lib/utils/trackChanges
 * @description Utility to track field-level changes on lead updates.
 * Compares old and new lead data, records differences in FieldChangeLog.
 * Non-blocking: errors are silently caught to avoid side effects.
 */
import dbConnect from "@/lib/db";
import FieldChangeLog from "@/models/FieldChangeLog";
import mongoose from "mongoose";

// Fields to track (human-readable labels)
const TRACKED_FIELDS: Record<string, string> = {
    name: "Name",
    email: "Email",
    phone: "Phone",
    status: "Status",
    source: "Source",
    value: "Deal Value",
    notes: "Notes",
    assignedTo: "Assigned To",
    followUpDate: "Follow-up Date",
    priority: "Priority",
};

/** Compare old vs new lead data and log field-level changes */
export async function trackLeadChanges(params: {
    orgId: string;
    leadId: string;
    oldData: Record<string, any>;
    newData: Record<string, any>;
    changedBy: string;
    changedByName: string;
}) {
    try {
        await dbConnect();
        const changes: Array<{
            orgId: mongoose.Types.ObjectId;
            leadId: mongoose.Types.ObjectId;
            field: string;
            oldValue: string;
            newValue: string;
            changedBy: mongoose.Types.ObjectId;
            changedByName: string;
        }> = [];

        for (const [key, label] of Object.entries(TRACKED_FIELDS)) {
            const oldVal = normalizeValue(params.oldData[key]);
            const newVal = normalizeValue(params.newData[key]);

            if (oldVal !== newVal) {
                changes.push({
                    orgId: new mongoose.Types.ObjectId(params.orgId),
                    leadId: new mongoose.Types.ObjectId(params.leadId),
                    field: label,
                    oldValue: oldVal,
                    newValue: newVal,
                    changedBy: new mongoose.Types.ObjectId(params.changedBy),
                    changedByName: params.changedByName,
                });
            }
        }

        if (changes.length > 0) {
            await FieldChangeLog.insertMany(changes);
        }
    } catch {
        // Non-blocking — never throw
    }
}

/** Get change history for a lead */
export async function getLeadChangeHistory(leadId: string, limit = 50) {
    try {
        await dbConnect();
        const logs = await FieldChangeLog.find({ leadId: new mongoose.Types.ObjectId(leadId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return logs.map((l: any) => ({
            _id: l._id.toString(),
            field: l.field,
            oldValue: l.oldValue,
            newValue: l.newValue,
            changedByName: l.changedByName,
            createdAt: l.createdAt.toISOString(),
        }));
    } catch {
        return [];
    }
}

function normalizeValue(val: any): string {
    if (val === null || val === undefined) return "";
    if (val instanceof Date) return val.toISOString().slice(0, 10);
    if (Array.isArray(val)) return val.sort().join(", ");
    if (typeof val === "object" && val.toString) return val.toString();
    return String(val);
}
