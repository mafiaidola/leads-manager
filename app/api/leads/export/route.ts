/**
 * @route GET /api/leads/export
 * @description Multi-format lead export endpoint.
 *
 * Formats: CSV (with UTF-8 BOM), Excel (.xlsx with auto-sized columns),
 * Word (.docx with styled table), PDF (styled HTML-to-PDF).
 * Supports query filters: status, source, assignedTo, search.
 * Available to all authenticated users (scoped by orgId).
 */
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun, HeadingLevel, AlignmentType, WidthType } from "docx";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // RBAC: Only Admin/SuperAdmin can export leads
    const userRole = (session.user as any).role;
    const userIsSuperAdmin = !!(session.user as any).isSuperAdmin;
    if (userRole !== "ADMIN" && !userIsSuperAdmin) {
        return new NextResponse("Forbidden — only Admins can export leads", { status: 403 });
    }

    const orgId = (session.user as any).orgId;
    if (!orgId) {
        return new NextResponse("No organization context", { status: 400 });
    }

    try {
        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const format = searchParams.get("format") || "csv";
        const query: any = { deletedAt: null, orgId: new mongoose.Types.ObjectId(orgId) };

        if (searchParams.get("status")) query.status = searchParams.get("status");
        if (searchParams.get("source")) query.source = searchParams.get("source");
        if (searchParams.get("assignedTo")) query.assignedTo = searchParams.get("assignedTo");
        if (searchParams.get("search")) {
            const s = searchParams.get("search")!;
            query.$or = [
                { name: { $regex: s, $options: "i" } },
                { phone: { $regex: s, $options: "i" } },
                { email: { $regex: s, $options: "i" } },
            ];
        }

        // RBAC: Sales users only see their assigned leads
        const userRole = (session.user as any).role;
        if (userRole === "SALES") {
            query.assignedTo = new mongoose.Types.ObjectId((session.user as any).id);
        }

        const leads = await Lead.find(query)
            .populate("assignedTo", "name email")
            .populate("createdBy", "name")
            .sort({ createdAt: -1 })
            .lean();

        // Simplified data mapping (removed: company, position, website, tags, address fields)
        const rows = leads.map((lead: any, idx: number) => ({
            "#": lead.serialNumber || idx + 1,
            Name: lead.name || "",
            Email: lead.email || "",
            Phone: lead.phone || "",
            "Country Code": lead.countryCode || "",
            Status: lead.status || "",
            Source: lead.source || "",
            Product: lead.product || "",
            Value: lead.value || "",
            Currency: lead.currency || "AED",
            Description: lead.description || "",
            "Assigned To": (lead.assignedTo as any)?.name || "Unassigned",
            "Created By": (lead.createdBy as any)?.name || "System",
            Created: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "",
            Updated: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : "",
        }));

        const dateStr = new Date().toISOString().split("T")[0];

        // ─── CSV ───
        if (format === "csv") {
            const csvString = Papa.unparse(rows);
            const bom = '\uFEFF';
            return new NextResponse(bom + csvString, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename*=UTF-8''leads-export-${dateStr}.csv`,
                },
            });
        }

        // ─── EXCEL (XLSX) ───
        if (format === "excel") {
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Leads");

            if (rows.length > 0) {
                const colWidths = Object.keys(rows[0]).map((key) => ({
                    wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] || "").length)).valueOf(),
                }));
                ws["!cols"] = colWidths;
            }

            const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
            return new NextResponse(buf, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="leads-export-${dateStr}.xlsx"`,
                },
            });
        }

        // ─── WORD (DOCX) ───
        if (format === "word") {
            const headers = rows.length > 0 ? Object.keys(rows[0]) : ["No Data"];

            const headerRow = new TableRow({
                tableHeader: true,
                children: headers.map(
                    (h) =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Arial", color: "ffffff" })] })],
                            shading: { fill: "7c3aed", color: "ffffff" },
                            width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
                        })
                ),
            });

            const dataRows = rows.map(
                (row: any, i: number) =>
                    new TableRow({
                        children: headers.map(
                            (h) =>
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: String(row[h] || ""), size: 18, font: "Arial" })] })],
                                    width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
                                    shading: i % 2 === 0 ? { fill: "f5f3ff" } : undefined,
                                })
                        ),
                    })
            );

            const table = new Table({
                rows: [headerRow, ...dataRows],
                width: { size: 100, type: WidthType.PERCENTAGE },
            });

            const doc = new Document({
                sections: [
                    {
                        children: [
                            new Paragraph({
                                text: `Leads Manager — Export (${dateStr})`,
                                heading: HeadingLevel.HEADING_1,
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 300 },
                            }),
                            new Paragraph({
                                text: `Total: ${rows.length} leads`,
                                spacing: { after: 200 },
                            }),
                            table,
                        ],
                    },
                ],
            });

            const buffer = await Packer.toBuffer(doc);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "Content-Disposition": `attachment; filename="leads-export-${dateStr}.docx"`,
                },
            });
        }

        // ─── PDF (HTML-based) ───
        if (format === "pdf") {
            const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
            const thCells = headers.map(h => `<th style="background:#7c3aed;color:#fff;padding:8px 6px;font-size:11px;text-align:left;border-bottom:2px solid #6d28d9;">${h}</th>`).join("");
            const bodyRows = rows.map((row: any, i: number) => {
                const bg = i % 2 === 0 ? "#faf5ff" : "#ffffff";
                const cells = headers.map(h => `<td style="padding:6px;font-size:10px;border-bottom:1px solid #e9d5ff;">${row[h] || ""}</td>`).join("");
                return `<tr style="background:${bg}">${cells}</tr>`;
            }).join("");

            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #1a1a2e; }
                h1 { color: #7c3aed; font-size: 22px; text-align: center; margin-bottom: 4px; }
                .subtitle { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; border: 1px solid #e9d5ff; border-radius: 8px; }
                th, td { white-space: nowrap; }
                .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af; }
            </style></head><body>
                <h1>Leads Manager — Export</h1>
                <div class="subtitle">${dateStr} • ${rows.length} leads</div>
                <table><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table>
                <div class="footer">Generated by Leads Manager</div>
            </body></html>`;

            return new NextResponse(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Content-Disposition": `attachment; filename="leads-export-${dateStr}.html"`,
                },
            });
        }

        return NextResponse.json({ error: "Invalid format. Use csv, excel, word, or pdf." }, { status: 400 });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
    }
}
