import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Settings from "@/models/Settings";
import LeadNote from "@/models/LeadNote";
import LeadAction from "@/models/LeadAction";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        await dbConnect();

        const [leads, users, settings, notes, actions] = await Promise.all([
            Lead.find({}).lean(),
            User.find({}).select("-passwordHash").lean(),
            Settings.findOne().lean(),
            LeadNote.find({}).lean(),
            LeadAction.find({}).lean(),
        ]);

        const backup = {
            exportedAt: new Date().toISOString(),
            exportedBy: session.user.email,
            data: {
                leads,
                users,
                settings,
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
