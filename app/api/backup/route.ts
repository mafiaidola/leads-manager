import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Organization from "@/models/Organization";
import LeadNote from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).orgId;
    if (!orgId) {
        return NextResponse.json({ error: "No organization context" }, { status: 400 });
    }

    try {
        await dbConnect();
        const [leads, users, org, notes, actions] = await Promise.all([
            Lead.find({ orgId }).lean(),
            User.find({ orgId }).lean(),
            Organization.findById(orgId).lean(),
            LeadNote.find({ orgId }).lean(),
            LeadAction.find({ orgId }).lean(),
        ]);

        const backup = {
            exportedAt: new Date().toISOString(),
            exportedBy: session.user.name || session.user.email || "Admin",
            data: {
                leads,
                users,
                settings: org?.settings || null,
                notes,
                actions,
            },
            stats: {
                totalLeads: leads.length,
                totalUsers: users.length,
                totalNotes: notes.length,
                totalActions: actions.length,
            },
        };

        return new NextResponse(JSON.stringify(backup, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="leads-backup-${new Date().toISOString().slice(0, 10)}.json"`,
            },
        });
    } catch (error) {
        console.error("Backup error:", error);
        return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
    }
}
