/**
 * @route GET /api/leads/export
 * @description Multi-format lead export endpoint with org branding.
 *
 * Formats: CSV (UTF-8 BOM), Excel (.xlsx with styled headers), Word (.docx branded),
 * PDF (printable HTML with org branding — opens in browser for Print→PDF).
 *
 * Query params: format, status, source, assignedTo, search
 * RBAC: Admin / SuperAdmin only.
 */
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Organization from "@/models/Organization";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle } from "docx";

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

        // Get org branding for styled exports
        const org = await Organization.findById(orgId).select("name branding settings").lean();
        const brandName = (org as any)?.branding?.appName || (org as any)?.name || "Leads Manager";
        const brandColor = (org as any)?.branding?.accentColor || "#7c3aed";

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

        const leads = await Lead.find(query)
            .populate("assignedTo", "name email")
            .populate("createdBy", "name")
            .sort({ createdAt: -1 })
            .lean();

        // Build lookup maps for human-readable labels
        const statusMap: Record<string, string> = {};
        const sourceMap: Record<string, string> = {};
        const productMap: Record<string, string> = {};
        if ((org as any)?.settings?.statuses) {
            (org as any).settings.statuses.forEach((s: any) => { statusMap[s.key] = s.label; });
        }
        if ((org as any)?.settings?.sources) {
            (org as any).settings.sources.forEach((s: any) => { sourceMap[s.key] = s.label; });
        }
        if ((org as any)?.settings?.products) {
            (org as any).settings.products.forEach((s: any) => { productMap[s.key] = s.label; });
        }

        const rows = leads.map((lead: any, idx: number) => ({
            "#": lead.serialNumber || idx + 1,
            "Name": lead.name || "",
            "Email": lead.email || "",
            "Phone": lead.phone || "",
            "Country Code": lead.countryCode || "",
            "Status": statusMap[lead.status] || lead.status || "",
            "Source": sourceMap[lead.source] || lead.source || "",
            "Product": productMap[lead.product] || lead.product || "",
            "Value": lead.value || "",
            "Currency": lead.currency || "AED",
            "Description": lead.description || "",
            "Assigned To": (lead.assignedTo as any)?.name || "Unassigned",
            "Created By": (lead.createdBy as any)?.name || "System",
            "Created": lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "",
            "Updated": lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : "",
        }));

        const dateStr = new Date().toISOString().split("T")[0];

        // ─── CSV ───────────────────────────────────────────────────────────
        if (format === "csv") {
            const csvString = Papa.unparse(rows);
            const bom = '\uFEFF';
            return new NextResponse(bom + csvString, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(brandName)}-leads-${dateStr}.csv`,
                },
            });
        }

        // ─── EXCEL (.xlsx) — Branded with styled header row ────────────────
        if (format === "excel") {
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Leads");

            // Auto-size columns
            if (rows.length > 0) {
                const colWidths = Object.keys(rows[0]).map((key) => ({
                    wch: Math.min(
                        Math.max(key.length + 2, ...rows.map((r: any) => String(r[key] || "").length + 2)),
                        40 // cap column width
                    ),
                }));
                ws["!cols"] = colWidths;
            }

            const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
            return new NextResponse(buf, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="${brandName}-leads-${dateStr}.xlsx"`,
                },
            });
        }

        // ─── WORD (.docx) — Branded ────────────────────────────────────────
        if (format === "word") {
            const headers = rows.length > 0 ? Object.keys(rows[0]) : ["No Data"];
            // Convert hex to docx color (remove #)
            const brandHex = brandColor.replace("#", "");

            const headerRow = new TableRow({
                tableHeader: true,
                children: headers.map(
                    (h) =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Segoe UI", color: "ffffff" })] })],
                            shading: { fill: brandHex, color: "ffffff" },
                            width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: brandHex },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: brandHex },
                            },
                        })
                ),
            });

            const dataRows = rows.map(
                (row: any, i: number) =>
                    new TableRow({
                        children: headers.map(
                            (h) =>
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: String(row[h] || ""), size: 18, font: "Segoe UI" })] })],
                                    width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
                                    shading: i % 2 === 0 ? { fill: "f8f7ff" } : undefined,
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
                                children: [new TextRun({ text: brandName, bold: true, size: 36, font: "Segoe UI", color: brandHex })],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 100 },
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: `Leads Export — ${dateStr}`, size: 22, font: "Segoe UI", color: "6b7280" })],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 100 },
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: `Total: ${rows.length} leads`, size: 20, font: "Segoe UI", color: "9ca3af" })],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 300 },
                            }),
                            table,
                            new Paragraph({
                                children: [new TextRun({ text: `Generated by ${brandName} • ${new Date().toLocaleString()}`, size: 16, font: "Segoe UI", color: "9ca3af" })],
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 300 },
                            }),
                        ],
                    },
                ],
            });

            const buffer = await Packer.toBuffer(doc);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "Content-Disposition": `attachment; filename="${brandName}-leads-${dateStr}.docx"`,
                },
            });
        }

        // ─── PDF (Branded HTML — open Print dialog for true PDF) ───────────
        if (format === "pdf") {
            const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
            const thCells = headers.map(h => `<th>${h}</th>`).join("");
            const bodyRows = rows.map((row: any, i: number) => {
                const cells = headers.map(h => `<td>${row[h] || ""}</td>`).join("");
                return `<tr class="${i % 2 === 0 ? 'even' : ''}">${cells}</tr>`;
            }).join("");

            const statusCounts: Record<string, number> = {};
            rows.forEach((r: any) => {
                const s = r.Status || "Unknown";
                statusCounts[s] = (statusCounts[s] || 0) + 1;
            });
            const statsSummary = Object.entries(statusCounts)
                .map(([k, v]) => `<span class="stat-chip">${k}: <strong>${v}</strong></span>`)
                .join("");

            const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${brandName} — Leads Export</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; background: #fff; }
    
    .header { background: linear-gradient(135deg, ${brandColor}, ${brandColor}dd); color: white; padding: 40px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    .header .subtitle { font-size: 14px; opacity: 0.85; }
    .header .meta { font-size: 12px; opacity: 0.7; margin-top: 8px; }
    
    .stats-bar { display: flex; gap: 8px; justify-content: center; padding: 16px 40px; flex-wrap: wrap; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .stat-chip { background: white; border: 1px solid #e5e7eb; border-radius: 20px; padding: 6px 14px; font-size: 12px; color: #6b7280; }
    .stat-chip strong { color: ${brandColor}; }
    
    .content { padding: 24px 40px 40px; }
    
    table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    thead { background: ${brandColor}; color: white; }
    th { padding: 10px 8px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    td { padding: 8px; border-bottom: 1px solid #f0f0f0; white-space: nowrap; }
    tr.even { background: #faf8ff; }
    tr:hover { background: #f3f0ff; }
    
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    
    @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
        .header { padding: 24px; }
        .content { padding: 16px; }
        table { font-size: 9px; }
        th, td { padding: 5px 4px; }
    }
</style>
</head><body>
    <div class="header">
        <h1>${brandName}</h1>
        <div class="subtitle">Leads Export Report</div>
        <div class="meta">${dateStr} • ${rows.length} leads</div>
    </div>
    <div class="stats-bar">${statsSummary}</div>
    <div class="content">
        <table><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    </div>
    <div class="footer">Generated by ${brandName} • ${new Date().toLocaleString()}</div>
    <script>window.onload = function() { window.print(); }</script>
</body></html>`;

            return new NextResponse(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                },
            });
        }

        return NextResponse.json({ error: "Invalid format. Use csv, excel, word, or pdf." }, { status: 400 });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
    }
}
