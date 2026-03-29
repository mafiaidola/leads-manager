/**
 * @script seed-fresh
 * @description Seeds the new MongoDB Atlas cluster with a complete demo dataset.
 * Includes: organization, users, leads (with pricing), notes, and settings.
 *
 * Usage: npx tsx scripts/seed-fresh.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI ||
    "mongodb+srv://leadsadmin:LeadsM2026SecureDB@cluster0.sumflmj.mongodb.net/leads-manager?retryWrites=true&w=majority&appName=Cluster0";

// ── Schemas (inline to avoid Next.js import issues) ──────────────────────

const orgSchema = new mongoose.Schema({
    name: String,
    slug: { type: String, unique: true },
    active: { type: Boolean, default: true },
    settings: {
        statuses: [{
            key: String,
            label: String,
            color: String,
            isSaleStatus: { type: Boolean, default: false },
        }],
        sources: [{ key: String, label: String }],
        products: [{ key: String, label: String, price: Number }],
        customFields: [{ key: String, label: String, type: String }],
        customRoles: [{ name: String, permissions: [String] }],
        goals: {
            monthlyLeadTarget: { type: Number, default: 50 },
            monthlyConversionTarget: { type: Number, default: 10 },
        },
        defaultCurrency: { type: String, default: "EGP" },
        autoAssignStrategy: { type: String, default: "round_robin" },
        theme: { type: String, default: "violet" },
        notifPrefs: {
            onNewLead: { type: Boolean, default: true },
            onAssigned: { type: Boolean, default: true },
            onLeadUpdated: { type: Boolean, default: true },
            onStatusChange: { type: Boolean, default: true },
            onLeadTransferred: { type: Boolean, default: true },
            onLeadDeleted: { type: Boolean, default: true },
            onBulkAction: { type: Boolean, default: true },
        },
    },
    branding: {
        appName: { type: String, default: "SMTC Group CRM" },
        accentColor: { type: String, default: "#8b5cf6" },
        logoUrl: String,
        loginTheme: { type: String, default: "aurora" },
    },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true },
    email: String,
    password: String,
    role: { type: String, default: "SALES" },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    isSuperAdmin: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    name: String,
    email: String,
    phone: String,
    countryCode: { type: String, default: "20" },
    company: String,
    status: String,
    source: String,
    product: String,
    value: Number,
    productPrice: Number,
    customPrice: Number,
    subTotal: Number,
    description: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    contactedToday: { type: Boolean, default: false },
    public: { type: Boolean, default: false },
    followUpDate: Date,
    deletedAt: Date,
    customFields: mongoose.Schema.Types.Mixed,
    city: String,
    country: String,
    tags: [String],
    serial: Number,
}, { timestamps: true });

const leadNoteSchema = new mongoose.Schema({
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, default: "note" },
    content: String,
}, { timestamps: true });

// ── Seed Data ────────────────────────────────────────────────────────────

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

const LEADS_DATA = [
    // ── New Leads ──
    { name: "Ahmed Hassan", email: "ahmed.h@gmail.com", phone: "1012345678", company: "Alpha Trading", status: "new", source: "facebook", product: "web_development", city: "Cairo", tags: ["hot"] },
    { name: "Fatma Ali", email: "fatma.a@outlook.com", phone: "1098765432", company: "Nile Corp", status: "new", source: "google_ads", product: "mobile_app", city: "Giza" },
    { name: "Omar Khaled", email: "omar.k@company.com", phone: "1123456789", company: "Pharaoh Tech", status: "new", source: "website", product: "seo_package", city: "Alexandria" },
    { name: "Mona Ibrahim", email: "mona.i@mail.com", phone: "1234567890", company: "Delta Solutions", status: "new", source: "instagram", product: "social_media", city: "Mansoura" },

    // ── Contacted ──
    { name: "Hassan Mohamed", email: "hassan.m@gmail.com", phone: "1055555555", company: "Sphinx Digital", status: "contacted", source: "whatsapp", product: "branding", city: "Cairo" },
    { name: "Layla Samir", email: "layla.s@outlook.com", phone: "1066666666", company: "Oasis Media", status: "contacted", source: "referral", product: "ecommerce", city: "Cairo", tags: ["vip"] },
    { name: "Youssef Adel", email: "youssef.a@gmail.com", phone: "1077777777", company: "Luxor Systems", status: "contacted", source: "linkedin", product: "it_consulting", city: "Luxor" },

    // ── Interested ──
    { name: "Sara Magdy", email: "sara.m@company.com", phone: "1088888888", company: "Aswan Group", status: "interested", source: "cold_call", product: "web_development", city: "Aswan" },
    { name: "Karim Nabil", email: "karim.n@gmail.com", phone: "1099999999", company: "Red Sea Tech", status: "interested", source: "exhibition", product: "mobile_app", city: "Hurghada", tags: ["hot", "urgent"] },
    { name: "Nour Elsayed", email: "nour.e@outlook.com", phone: "1011111111", company: "Suez Digital", status: "interested", source: "facebook", product: "cloud_hosting", city: "Suez" },

    // ── Negotiation ──
    { name: "Tamer Fouad", email: "tamer.f@gmail.com", phone: "1022222222", company: "Misr Technologies", status: "negotiation", source: "google_ads", product: "ecommerce", city: "Cairo", tags: ["enterprise"] },
    { name: "Dina Ashraf", email: "dina.a@company.com", phone: "1033333333", company: "Valley Corp", status: "negotiation", source: "website", product: "web_development", city: "Fayoum" },
    { name: "Mahmoud Rizk", email: "mahmoud.r@mail.com", phone: "1044444445", company: "Nile Valley IT", status: "negotiation", source: "referral", product: "it_consulting", city: "Beni Suef" },

    // ── Proposal Sent ──
    { name: "Amira Gamal", email: "amira.g@outlook.com", phone: "1055555556", company: "Smart Solutions EG", status: "proposal_sent", source: "linkedin", product: "mobile_app", city: "Cairo" },
    { name: "Khaled Youssef", email: "khaled.y@gmail.com", phone: "1066666667", company: "Pyramids Ventures", status: "proposal_sent", source: "cold_call", product: "branding", city: "Giza" },

    // ── Order (Sale!) ──
    { name: "Rania Hossam", email: "rania.h@company.com", phone: "1077777778", company: "Cairo Digital Agency", status: "order", source: "facebook", product: "web_development", city: "Cairo", tags: ["vip"] },
    { name: "Mostafa Salem", email: "mostafa.s@gmail.com", phone: "1088888889", company: "Alexandria Technology", status: "order", source: "google_ads", product: "ecommerce", city: "Alexandria" },
    { name: "Heba Tarek", email: "heba.t@outlook.com", phone: "1099999990", company: "Delta Innovations", status: "order", source: "referral", product: "mobile_app", city: "Mansoura" },
    { name: "Emad Soliman", email: "emad.s@mail.com", phone: "1011111112", company: "Harbor IT Solutions", status: "order", source: "exhibition", product: "seo_package", city: "Port Said" },
    { name: "Asmaa Hafez", email: "asmaa.h@gmail.com", phone: "1022222223", company: "Pharaoh Digital", status: "order", source: "instagram", product: "social_media", city: "Cairo" },

    // ── Won / Closed (Sale!) ──
    { name: "Ziad Mansour", email: "ziad.m@company.com", phone: "1033333334", company: "Sphinx Innovations", status: "won", source: "whatsapp", product: "it_consulting", city: "Cairo", tags: ["enterprise", "vip"] },
    { name: "Salma Fathy", email: "salma.f@outlook.com", phone: "1044444446", company: "Nile Star Media", status: "won", source: "website", product: "branding", city: "Cairo" },
    { name: "Adel Ramadan", email: "adel.r@gmail.com", phone: "1055555557", company: "Oasis Ventures", status: "won", source: "linkedin", product: "cloud_hosting", city: "Giza" },
    { name: "Nagwa Sherif", email: "nagwa.s@mail.com", phone: "1066666668", company: "Red Sea Enterprises", status: "won", source: "facebook", product: "web_development", city: "Hurghada" },
    { name: "Waleed Abdallah", email: "waleed.a@company.com", phone: "1077777779", company: "Luxor Digital", status: "won", source: "google_ads", product: "ecommerce", city: "Luxor" },
    { name: "Iman Hesham", email: "iman.h@outlook.com", phone: "1088888890", company: "Suez Port Tech", status: "won", source: "cold_call", product: "mobile_app", city: "Suez" },

    // ── Lost ──
    { name: "Tarek Gaber", email: "tarek.g@gmail.com", phone: "1099999991", company: "Lost Corp", status: "lost", source: "facebook", product: "seo_package", city: "Cairo" },
    { name: "Noha Abdel Rahim", email: "noha.a@mail.com", phone: "1011111113", company: "Budget Traders", status: "lost", source: "instagram", product: "web_development", city: "Tanta" },

    // ── Not Interested ──
    { name: "Sameh Ragab", email: "sameh.r@outlook.com", phone: "1022222224", company: "Old Methods Inc", status: "not_interested", source: "cold_call", product: "cloud_hosting", city: "Assiut" },
    { name: "Hanan Sayed", email: "hanan.s@gmail.com", phone: "1033333335", company: "Traditional Biz", status: "not_interested", source: "exhibition", product: "social_media", city: "Minya" },

    // ── Follow Up ──
    { name: "Wael Barakat", email: "wael.b@company.com", phone: "1044444447", company: "Follow Tech", status: "follow_up", source: "whatsapp", product: "mobile_app", city: "Cairo", tags: ["warm"] },
    { name: "Ghada Nasser", email: "ghada.n@gmail.com", phone: "1055555558", company: "Pending Solutions", status: "follow_up", source: "referral", product: "ecommerce", city: "Alexandria", tags: ["warm"] },
    { name: "Ali Youssef", email: "ali.y@mail.com", phone: "1066666669", company: "Maybe Corp", status: "follow_up", source: "website", product: "it_consulting", city: "Cairo" },

    // ── More spread for variety ──
    { name: "Mariam Hosny", email: "mariam.h@gmail.com", phone: "1077777770", company: "Growth Partners EG", status: "interested", source: "google_ads", product: "web_development", city: "Cairo" },
    { name: "Hossam Fawzy", email: "hossam.f@company.com", phone: "1088888891", company: "Scale Solutions", status: "negotiation", source: "linkedin", product: "mobile_app", city: "Giza" },
    { name: "Reem Abdel Aziz", email: "reem.a@outlook.com", phone: "1099999992", company: "Bright Future IT", status: "order", source: "referral", product: "branding", city: "Cairo" },
    { name: "Mohamed Shaker", email: "mohamed.s@gmail.com", phone: "1011111114", company: "Creative Minds", status: "won", source: "facebook", product: "social_media", city: "Cairo", tags: ["hot"] },
    { name: "Yasmin Lotfy", email: "yasmin.l@mail.com", phone: "1022222225", company: "Innovative Hub", status: "contacted", source: "instagram", product: "seo_package", city: "Alexandria" },
    { name: "Shady Wahba", email: "shady.w@outlook.com", phone: "1033333336", company: "Quick Start EG", status: "new", source: "whatsapp", product: "cloud_hosting", city: "Cairo" },
    { name: "Nesrin Kamal", email: "nesrin.k@gmail.com", phone: "1044444448", company: "Horizon Group", status: "proposal_sent", source: "exhibition", product: "ecommerce", city: "Mansoura" },
];

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

// ── Main Seed Function ──────────────────────────────────────────────────

async function seed() {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const db = mongoose.connection.db!;

    // Drop existing collections
    console.log("🗑️  Clearing existing data...");
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
        await db.dropCollection(col.name);
    }
    console.log("   Done\n");

    // Register models
    const Organization = mongoose.model("Organization", orgSchema);
    const User = mongoose.model("User", userSchema);
    const Lead = mongoose.model("Lead", leadSchema);
    const LeadNote = mongoose.model("LeadNote", leadNoteSchema);

    // 1. Create Organization
    console.log("🏢 Creating organization...");
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
                onNewLead: true,
                onAssigned: true,
                onLeadUpdated: true,
                onStatusChange: true,
                onLeadTransferred: true,
                onLeadDeleted: true,
                onBulkAction: true,
            },
        },
        branding: {
            appName: "SMTC Group CRM",
            accentColor: "#8b5cf6",
            logoUrl: "",
            loginTheme: "aurora",
        },
    });
    console.log(`   ✅ Created: ${org.name} (${org.slug})\n`);

    // 2. Create Users
    console.log("👥 Creating users...");
    const hashedPass = await bcrypt.hash("Admin@2026", 12);
    const salesPass = await bcrypt.hash("Sales@2026", 12);

    const admin = await User.create({
        name: "Mody (Admin)",
        username: "admin",
        email: "admin@smtcgroup.com",
        password: hashedPass,
        role: "ADMIN",
        orgId: org._id,
        isSuperAdmin: true,
        active: true,
    });

    const salesUsers = await User.create([
        { name: "Ahmed Sales", username: "ahmed.sales", email: "ahmed@smtcgroup.com", password: salesPass, role: "SALES", orgId: org._id, active: true },
        { name: "Sara Sales", username: "sara.sales", email: "sara@smtcgroup.com", password: salesPass, role: "SALES", orgId: org._id, active: true },
        { name: "Omar Sales", username: "omar.sales", email: "omar@smtcgroup.com", password: salesPass, role: "SALES", orgId: org._id, active: true },
    ]);

    const marketing = await User.create({
        name: "Layla Marketing",
        username: "layla.marketing",
        email: "layla@smtcgroup.com",
        password: salesPass,
        role: "MARKETING",
        orgId: org._id,
        active: true,
    });

    const iqa = await User.create({
        name: "Khaled QA",
        username: "khaled.iqa",
        email: "khaled@smtcgroup.com",
        password: salesPass,
        role: "IQA",
        orgId: org._id,
        active: true,
    });

    const allSalesAgents = [admin, ...salesUsers, marketing];
    console.log(`   ✅ Created ${2 + salesUsers.length} users (admin + ${salesUsers.length} sales + 1 marketing + 1 IQA)\n`);

    // 3. Create Leads with pricing
    console.log("📋 Creating leads...");
    const productMap = new Map(PRODUCTS.map(p => [p.key, p.price]));

    const createdLeads = [];
    for (let i = 0; i < LEADS_DATA.length; i++) {
        const lead = LEADS_DATA[i];
        const agent = allSalesAgents[i % allSalesAgents.length];
        const basePrice = productMap.get(lead.product) || 5000;

        // Simulate real pricing variation: some leads get discounts, some get upcharges
        const priceVariation = (Math.random() * 0.4 - 0.15); // -15% to +25%
        const customPrice = Math.round(basePrice * (1 + priceVariation));
        const subTotal = customPrice - basePrice;

        // Only set pricing for sale-status leads
        const isSale = ["order", "won"].includes(lead.status);
        const isNegotiation = ["negotiation", "proposal_sent"].includes(lead.status);

        const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // within last 90 days

        const newLead = await Lead.create({
            orgId: org._id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            countryCode: "20",
            company: lead.company,
            status: lead.status,
            source: lead.source,
            product: lead.product,
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
            city: lead.city,
            country: "Egypt",
            tags: lead.tags || [],
            serial: i + 1,
            followUpDate: ["follow_up", "interested", "negotiation"].includes(lead.status)
                ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000)
                : undefined,
            createdAt,
            updatedAt: new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
        createdLeads.push(newLead);
    }
    console.log(`   ✅ Created ${createdLeads.length} leads\n`);

    // 4. Create Notes for some leads
    console.log("📝 Creating notes...");
    let noteCount = 0;
    for (const lead of createdLeads) {
        // Add 1-3 notes for non-new leads
        if (lead.status !== "new") {
            const numNotes = Math.floor(Math.random() * 3) + 1;
            for (let n = 0; n < numNotes; n++) {
                const agent = allSalesAgents[Math.floor(Math.random() * allSalesAgents.length)];
                await LeadNote.create({
                    leadId: lead._id,
                    authorId: agent._id,
                    type: Math.random() > 0.7 ? "action" : "note",
                    content: NOTES[Math.floor(Math.random() * NOTES.length)],
                    createdAt: new Date(lead.createdAt!.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000),
                });
                noteCount++;
            }
        }
    }
    console.log(`   ✅ Created ${noteCount} notes\n`);

    // 5. Summary
    const saleLeads = createdLeads.filter(l => ["order", "won"].includes(l.status!));
    const totalRevenue = saleLeads.reduce((sum, l) => sum + (l.customPrice || l.productPrice || 0), 0);

    console.log("═══════════════════════════════════════════════════");
    console.log("  🎉 SEED COMPLETE — Database is ready!");
    console.log("═══════════════════════════════════════════════════");
    console.log("");
    console.log("  📊 Summary:");
    console.log(`     Organization: ${org.name} (${org.slug})`);
    console.log(`     Users:        ${2 + salesUsers.length} (1 admin + ${salesUsers.length} sales + 1 marketing + 1 IQA)`);
    console.log(`     Leads:        ${createdLeads.length}`);
    console.log(`     Notes:        ${noteCount}`);
    console.log(`     Sales:        ${saleLeads.length} leads (order + won)`);
    console.log(`     Revenue:      ${totalRevenue.toLocaleString()} EGP`);
    console.log("");
    console.log("  🔑 Login Credentials:");
    console.log("     ┌─────────────────┬────────────────┬───────────┐");
    console.log("     │  Username       │  Password      │  Role     │");
    console.log("     ├─────────────────┼────────────────┼───────────┤");
    console.log("     │  admin          │  Admin@2026    │  ADMIN    │");
    console.log("     │  ahmed.sales    │  Sales@2026    │  SALES    │");
    console.log("     │  sara.sales     │  Sales@2026    │  SALES    │");
    console.log("     │  omar.sales     │  Sales@2026    │  SALES    │");
    console.log("     │  layla.marketing│  Sales@2026    │  MARKETING│");
    console.log("     │  khaled.iqa     │  Sales@2026    │  IQA      │");
    console.log("     └─────────────────┴────────────────┴───────────┘");
    console.log("");
    console.log("  🌐 Connection String:");
    console.log(`     ${MONGODB_URI}`);
    console.log("");

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
