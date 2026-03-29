import { NextRequest, NextResponse } from "next/server";
/**
 * @route GET /api/seed
 * @description Seeds the database. Supports multiple actions:
 * - Default: creates basic admin user
 * - ?action=full-seed: full comprehensive seed with leads, pricing, users
 * - ?action=promote&username=X: promote user to SuperAdmin
 * - ?action=reset-password&username=X&password=Y: reset password
 */
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Organization from "@/models/Organization";
import Lead from "@/models/Lead";
import LeadNote from "@/models/LeadNote";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    // Security: Always require SEED_SECRET
    const seedSecret = process.env.SEED_SECRET?.trim();
    const providedSecret = request.nextUrl.searchParams.get("secret")?.trim();

    if (!seedSecret || providedSecret !== seedSecret) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get("action");

    // ── Promote action ──
    if (action === "promote") {
        const username = request.nextUrl.searchParams.get("username");
        if (!username) return NextResponse.json({ error: "Missing ?username=" }, { status: 400 });
        await dbConnect();
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) return NextResponse.json({ error: `User "${username}" not found` }, { status: 404 });
        user.isSuperAdmin = true;
        await user.save();
        return NextResponse.json({
            message: `✅ "${user.name}" promoted to SuperAdmin.`,
            user: { name: user.name, username: user.username, isSuperAdmin: true },
        });
    }

    // ── Reset password action ──
    if (action === "reset-password") {
        const username = request.nextUrl.searchParams.get("username");
        const newPassword = request.nextUrl.searchParams.get("password");
        if (!username || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "Missing ?username= and ?password= (min 6 chars)" }, { status: 400 });
        }
        await dbConnect();
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) return NextResponse.json({ error: `User "${username}" not found` }, { status: 404 });
        user.passwordHash = await bcryptjs.hash(newPassword, 10);
        await user.save();
        return NextResponse.json({
            message: `✅ Password reset for "${user.name}" (${user.username}).`,
        });
    }

    // ── Full comprehensive seed ──
    if (action === "full-seed") {
        try {
            await dbConnect();

            // Check if already seeded
            const existingOrg = await Organization.findOne({ slug: "smtc-group" });
            if (existingOrg) {
                return NextResponse.json({
                    message: "⚠️ Database already seeded (smtc-group exists). Use ?action=full-seed&force=true to re-seed.",
                    existing: true,
                });
            }

            const STATUSES = [
                { key: "new", label: "New", color: "#3b82f6", isSaleStatus: false },
                { key: "contacted", label: "Contacted", color: "#06b6d4", isSaleStatus: false },
                { key: "interested", label: "Interested", color: "#f59e0b", isSaleStatus: false },
                { key: "negotiation", label: "Negotiation", color: "#f97316", isSaleStatus: false },
                { key: "proposal_sent", label: "Proposal Sent", color: "#a855f7", isSaleStatus: false },
                { key: "order", label: "Order", color: "#22c55e", isSaleStatus: true },
                { key: "won", label: "Won / Closed", color: "#10b981", isSaleStatus: true },
                { key: "lost", label: "Lost", color: "#ef4444", isSaleStatus: false },
                { key: "not_interested", label: "Not Interested", color: "#6b7280", isSaleStatus: false },
                { key: "follow_up", label: "Follow Up", color: "#8b5cf6", isSaleStatus: false },
            ];

            const SOURCES = [
                { key: "website", label: "Website" },
                { key: "facebook", label: "Facebook" },
                { key: "instagram", label: "Instagram" },
                { key: "whatsapp", label: "WhatsApp" },
                { key: "referral", label: "Referral" },
                { key: "google_ads", label: "Google Ads" },
                { key: "cold_call", label: "Cold Call" },
                { key: "exhibition", label: "Exhibition" },
                { key: "linkedin", label: "LinkedIn" },
            ];

            const PRODUCTS = [
                { key: "web_development", label: "Web Development", price: 15000 },
                { key: "mobile_app", label: "Mobile App Development", price: 25000 },
                { key: "seo_package", label: "SEO Package", price: 5000 },
                { key: "social_media", label: "Social Media Management", price: 3500 },
                { key: "branding", label: "Branding & Identity", price: 8000 },
                { key: "ecommerce", label: "E-Commerce Solutions", price: 20000 },
                { key: "it_consulting", label: "IT Consulting", price: 10000 },
                { key: "cloud_hosting", label: "Cloud Hosting", price: 2000 },
            ];

            // 1. Create Organization
            const org = await Organization.create({
                name: "SMTC Group",
                slug: "smtc-group",
                active: true,
                settings: {
                    statuses: STATUSES,
                    sources: SOURCES,
                    products: PRODUCTS,
                    customFields: [
                        { key: "company_size", label: "Company Size", type: "select" },
                        { key: "budget_range", label: "Budget Range", type: "text" },
                        { key: "deadline", label: "Project Deadline", type: "date" },
                    ],
                    customRoles: [],
                    goals: { monthlyLeadTarget: 100, monthlyConversionTarget: 20 },
                    defaultCurrency: "EGP",
                    autoAssignStrategy: "round_robin",
                    theme: "violet",
                    notifPrefs: {
                        onNewLead: true, onAssigned: true, onLeadUpdated: true,
                        onStatusChange: true, onLeadTransferred: true, onLeadDeleted: true, onBulkAction: true,
                    },
                },
                branding: {
                    appName: "SMTC Group CRM",
                    accentColor: "#8b5cf6",
                    logoUrl: "",
                    loginTheme: "aurora",
                },
            });

            // 2. Create Users
            const adminPass = await bcryptjs.hash("Admin@2026", 12);
            const salesPass = await bcryptjs.hash("Sales@2026", 12);

            const admin = await User.create({
                name: "Mody (Admin)", username: "admin", email: "admin@smtcgroup.com",
                passwordHash: adminPass, role: "ADMIN", orgId: org._id, isSuperAdmin: true, active: true,
            });
            const salesUsers = await User.create([
                { name: "Ahmed Sales", username: "ahmed.sales", email: "ahmed@smtcgroup.com", passwordHash: salesPass, role: "SALES", orgId: org._id, active: true },
                { name: "Sara Sales", username: "sara.sales", email: "sara@smtcgroup.com", passwordHash: salesPass, role: "SALES", orgId: org._id, active: true },
                { name: "Omar Sales", username: "omar.sales", email: "omar@smtcgroup.com", passwordHash: salesPass, role: "SALES", orgId: org._id, active: true },
            ]);
            const marketing = await User.create({
                name: "Layla Marketing", username: "layla.marketing", email: "layla@smtcgroup.com",
                passwordHash: salesPass, role: "MARKETING", orgId: org._id, active: true,
            });
            await User.create({
                name: "Khaled QA", username: "khaled.iqa", email: "khaled@smtcgroup.com",
                passwordHash: salesPass, role: "IQA", orgId: org._id, active: true,
            });

            const allAgents = [admin, ...salesUsers, marketing];

            // 3. Create Leads
            const LEADS = [
                { name: "Ahmed Hassan", email: "ahmed.h@gmail.com", phone: "1012345678", company: "Alpha Trading", status: "new", source: "facebook", product: "web_development", city: "Cairo", tags: ["hot"] },
                { name: "Fatma Ali", email: "fatma.a@outlook.com", phone: "1098765432", company: "Nile Corp", status: "new", source: "google_ads", product: "mobile_app", city: "Giza" },
                { name: "Omar Khaled", email: "omar.k@company.com", phone: "1123456789", company: "Pharaoh Tech", status: "new", source: "website", product: "seo_package", city: "Alexandria" },
                { name: "Mona Ibrahim", email: "mona.i@mail.com", phone: "1234567890", company: "Delta Solutions", status: "new", source: "instagram", product: "social_media", city: "Mansoura" },
                { name: "Hassan Mohamed", email: "hassan.m@gmail.com", phone: "1055555555", company: "Sphinx Digital", status: "contacted", source: "whatsapp", product: "branding", city: "Cairo" },
                { name: "Layla Samir", email: "layla.s@outlook.com", phone: "1066666666", company: "Oasis Media", status: "contacted", source: "referral", product: "ecommerce", city: "Cairo", tags: ["vip"] },
                { name: "Youssef Adel", email: "youssef.a@gmail.com", phone: "1077777777", company: "Luxor Systems", status: "contacted", source: "linkedin", product: "it_consulting", city: "Luxor" },
                { name: "Sara Magdy", email: "sara.m@company.com", phone: "1088888888", company: "Aswan Group", status: "interested", source: "cold_call", product: "web_development", city: "Aswan" },
                { name: "Karim Nabil", email: "karim.n@gmail.com", phone: "1099999999", company: "Red Sea Tech", status: "interested", source: "exhibition", product: "mobile_app", city: "Hurghada", tags: ["hot", "urgent"] },
                { name: "Nour Elsayed", email: "nour.e@outlook.com", phone: "1011111111", company: "Suez Digital", status: "interested", source: "facebook", product: "cloud_hosting", city: "Suez" },
                { name: "Tamer Fouad", email: "tamer.f@gmail.com", phone: "1022222222", company: "Misr Technologies", status: "negotiation", source: "google_ads", product: "ecommerce", city: "Cairo", tags: ["enterprise"] },
                { name: "Dina Ashraf", email: "dina.a@company.com", phone: "1033333333", company: "Valley Corp", status: "negotiation", source: "website", product: "web_development", city: "Fayoum" },
                { name: "Mahmoud Rizk", email: "mahmoud.r@mail.com", phone: "1044444445", company: "Nile Valley IT", status: "negotiation", source: "referral", product: "it_consulting", city: "Beni Suef" },
                { name: "Amira Gamal", email: "amira.g@outlook.com", phone: "1055555556", company: "Smart Solutions EG", status: "proposal_sent", source: "linkedin", product: "mobile_app", city: "Cairo" },
                { name: "Khaled Youssef", email: "khaled.y@gmail.com", phone: "1066666667", company: "Pyramids Ventures", status: "proposal_sent", source: "cold_call", product: "branding", city: "Giza" },
                { name: "Rania Hossam", email: "rania.h@company.com", phone: "1077777778", company: "Cairo Digital Agency", status: "order", source: "facebook", product: "web_development", city: "Cairo", tags: ["vip"] },
                { name: "Mostafa Salem", email: "mostafa.s@gmail.com", phone: "1088888889", company: "Alexandria Tech", status: "order", source: "google_ads", product: "ecommerce", city: "Alexandria" },
                { name: "Heba Tarek", email: "heba.t@outlook.com", phone: "1099999990", company: "Delta Innovations", status: "order", source: "referral", product: "mobile_app", city: "Mansoura" },
                { name: "Emad Soliman", email: "emad.s@mail.com", phone: "1011111112", company: "Harbor IT", status: "order", source: "exhibition", product: "seo_package", city: "Port Said" },
                { name: "Asmaa Hafez", email: "asmaa.h@gmail.com", phone: "1022222223", company: "Pharaoh Digital", status: "order", source: "instagram", product: "social_media", city: "Cairo" },
                { name: "Ziad Mansour", email: "ziad.m@company.com", phone: "1033333334", company: "Sphinx Innovations", status: "won", source: "whatsapp", product: "it_consulting", city: "Cairo", tags: ["enterprise", "vip"] },
                { name: "Salma Fathy", email: "salma.f@outlook.com", phone: "1044444446", company: "Nile Star Media", status: "won", source: "website", product: "branding", city: "Cairo" },
                { name: "Adel Ramadan", email: "adel.r@gmail.com", phone: "1055555557", company: "Oasis Ventures", status: "won", source: "linkedin", product: "cloud_hosting", city: "Giza" },
                { name: "Nagwa Sherif", email: "nagwa.s@mail.com", phone: "1066666668", company: "Red Sea Enterprises", status: "won", source: "facebook", product: "web_development", city: "Hurghada" },
                { name: "Waleed Abdallah", email: "waleed.a@company.com", phone: "1077777779", company: "Luxor Digital", status: "won", source: "google_ads", product: "ecommerce", city: "Luxor" },
                { name: "Iman Hesham", email: "iman.h@outlook.com", phone: "1088888890", company: "Suez Port Tech", status: "won", source: "cold_call", product: "mobile_app", city: "Suez" },
                { name: "Tarek Gaber", email: "tarek.g@gmail.com", phone: "1099999991", company: "Lost Corp", status: "lost", source: "facebook", product: "seo_package", city: "Cairo" },
                { name: "Noha Abdel Rahim", email: "noha.a@mail.com", phone: "1011111113", company: "Budget Traders", status: "lost", source: "instagram", product: "web_development", city: "Tanta" },
                { name: "Sameh Ragab", email: "sameh.r@outlook.com", phone: "1022222224", company: "Old Methods Inc", status: "not_interested", source: "cold_call", product: "cloud_hosting", city: "Assiut" },
                { name: "Hanan Sayed", email: "hanan.s@gmail.com", phone: "1033333335", company: "Traditional Biz", status: "not_interested", source: "exhibition", product: "social_media", city: "Minya" },
                { name: "Wael Barakat", email: "wael.b@company.com", phone: "1044444447", company: "Follow Tech", status: "follow_up", source: "whatsapp", product: "mobile_app", city: "Cairo", tags: ["warm"] },
                { name: "Ghada Nasser", email: "ghada.n@gmail.com", phone: "1055555558", company: "Pending Solutions", status: "follow_up", source: "referral", product: "ecommerce", city: "Alexandria", tags: ["warm"] },
                { name: "Ali Youssef", email: "ali.y@mail.com", phone: "1066666669", company: "Maybe Corp", status: "follow_up", source: "website", product: "it_consulting", city: "Cairo" },
                { name: "Mariam Hosny", email: "mariam.h@gmail.com", phone: "1077777770", company: "Growth Partners", status: "interested", source: "google_ads", product: "web_development", city: "Cairo" },
                { name: "Hossam Fawzy", email: "hossam.f@company.com", phone: "1088888891", company: "Scale Solutions", status: "negotiation", source: "linkedin", product: "mobile_app", city: "Giza" },
                { name: "Reem Abdel Aziz", email: "reem.a@outlook.com", phone: "1099999992", company: "Bright Future IT", status: "order", source: "referral", product: "branding", city: "Cairo" },
                { name: "Mohamed Shaker", email: "mohamed.s@gmail.com", phone: "1011111114", company: "Creative Minds", status: "won", source: "facebook", product: "social_media", city: "Cairo", tags: ["hot"] },
                { name: "Yasmin Lotfy", email: "yasmin.l@mail.com", phone: "1022222225", company: "Innovative Hub", status: "contacted", source: "instagram", product: "seo_package", city: "Alexandria" },
                { name: "Shady Wahba", email: "shady.w@outlook.com", phone: "1033333336", company: "Quick Start EG", status: "new", source: "whatsapp", product: "cloud_hosting", city: "Cairo" },
                { name: "Nesrin Kamal", email: "nesrin.k@gmail.com", phone: "1044444448", company: "Horizon Group", status: "proposal_sent", source: "exhibition", product: "ecommerce", city: "Mansoura" },
            ];

            const productMap = new Map(PRODUCTS.map(p => [p.key, p.price]));
            const NOTES = [
                "Called the client, discussed requirements in detail.",
                "Sent pricing proposal via email.",
                "Client requested a demo session next week.",
                "Follow-up meeting scheduled for Thursday.",
                "Client confirmed budget, moving to contract phase.",
                "Discussed payment terms and delivery timeline.",
                "Client interested in additional services.",
                "Needs approval from management before proceeding.",
                "Great call — very enthusiastic about the project.",
                "Sent updated quotation with bundle discount.",
            ];

            const createdLeads = [];
            for (let i = 0; i < LEADS.length; i++) {
                const lead = LEADS[i];
                const agent = allAgents[i % allAgents.length];
                const basePrice = productMap.get(lead.product) || 5000;
                const priceVariation = (Math.random() * 0.4 - 0.15);
                const customPrice = Math.round(basePrice * (1 + priceVariation));
                const subTotal = customPrice - basePrice;
                const isSale = ["order", "won"].includes(lead.status);
                const isNegotiation = ["negotiation", "proposal_sent"].includes(lead.status);
                const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);

                const newLead = await Lead.create({
                    orgId: org._id,
                    name: lead.name, email: lead.email, phone: lead.phone,
                    countryCode: "20", company: lead.company,
                    status: lead.status, source: lead.source, product: lead.product,
                    value: isSale ? customPrice : (isNegotiation ? basePrice : undefined),
                    productPrice: (isSale || isNegotiation) ? basePrice : undefined,
                    customPrice: isSale ? customPrice : undefined,
                    subTotal: isSale ? subTotal : undefined,
                    description: `Lead for ${PRODUCTS.find(p => p.key === lead.product)?.label || lead.product}`,
                    assignedTo: agent._id,
                    createdBy: admin._id,
                    updatedBy: agent._id,
                    contactedToday: Math.random() > 0.7,
                    public: Math.random() > 0.8,
                    city: lead.city, country: "Egypt",
                    tags: (lead as any).tags || [],
                    serial: i + 1,
                    followUpDate: ["follow_up", "interested", "negotiation"].includes(lead.status)
                        ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000) : undefined,
                    createdAt, updatedAt: new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
                });
                createdLeads.push(newLead);
            }

            // 4. Create Notes
            let noteCount = 0;
            for (const cl of createdLeads) {
                if (cl.status !== "new") {
                    const numNotes = Math.floor(Math.random() * 3) + 1;
                    for (let n = 0; n < numNotes; n++) {
                        const agent = allAgents[Math.floor(Math.random() * allAgents.length)];
                        await LeadNote.create({
                            leadId: cl._id, authorId: agent._id,
                            type: Math.random() > 0.7 ? "action" : "note",
                            content: NOTES[Math.floor(Math.random() * NOTES.length)],
                        });
                        noteCount++;
                    }
                }
            }

            const saleLeads = createdLeads.filter(l => ["order", "won"].includes(l.status!));
            const totalRevenue = saleLeads.reduce((sum, l) => sum + (l.customPrice || l.productPrice || 0), 0);

            return NextResponse.json({
                message: "🎉 Full seed complete!",
                summary: {
                    organization: org.name,
                    users: 6,
                    leads: createdLeads.length,
                    notes: noteCount,
                    sales: saleLeads.length,
                    totalRevenue: `${totalRevenue.toLocaleString()} EGP`,
                },
                credentials: {
                    admin: { username: "admin", password: "Admin@2026", role: "ADMIN (SuperAdmin)" },
                    sales: [
                        { username: "ahmed.sales", password: "Sales@2026" },
                        { username: "sara.sales", password: "Sales@2026" },
                        { username: "omar.sales", password: "Sales@2026" },
                    ],
                    marketing: { username: "layla.marketing", password: "Sales@2026" },
                    iqa: { username: "khaled.iqa", password: "Sales@2026" },
                },
            });
        } catch (error) {
            console.error("Full seed error:", error);
            return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
        }
    }

    // ── Default: basic admin seed ──
    try {
        await dbConnect();
        let org = await Organization.findOne({ slug: "default" });
        if (!org) {
            org = await Organization.create({
                name: "Default Organization", slug: "default", active: true,
                branding: { appName: "Leads Manager" },
            });
        }
        const existingAdmin = await User.findOne({
            $or: [{ email: "admin@example.com" }, { username: "admin" }],
            orgId: org._id,
        });
        if (!existingAdmin) {
            const hashedPassword = await bcryptjs.hash("admin123", 12);
            await User.create({
                name: "Admin User", username: "admin", email: "admin@example.com",
                passwordHash: hashedPassword, role: "ADMIN", active: true,
                orgId: org._id, isSuperAdmin: true,
            });
            return NextResponse.json({ message: `Admin seeded for "${org.name}". Login: admin / admin123` });
        }
        return NextResponse.json({ message: "Admin already exists" });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
