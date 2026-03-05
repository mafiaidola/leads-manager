/**
 * @route POST /api/upload — upload image to Vercel Blob (max 2MB, PNG/JPG/WebP/SVG)
 * @route DELETE /api/upload — delete a blob by URL
 * @description File upload endpoint for org branding logos.
 */
"use server";

import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/auth";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.orgId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type. Allowed: PNG, JPG, WebP, SVG` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is 2MB` },
                { status: 400 }
            );
        }

        // Upload to Vercel Blob
        const ext = file.name.split(".").pop() || "png";
        const filename = `org-logos/${session.user.orgId}-${Date.now()}.${ext}`;

        const blob = await put(filename, file, {
            access: "public",
            addRandomSuffix: false,
        });

        return NextResponse.json({ url: blob.url });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed" },
            { status: 500 }
        );
    }
}

// Delete a blob by URL
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.orgId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: "No URL provided" }, { status: 400 });
        }

        await del(url);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete blob error:", error);
        return NextResponse.json(
            { error: error.message || "Delete failed" },
            { status: 500 }
        );
    }
}
