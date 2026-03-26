/**
 * @route POST /api/fix-email-index
 * @description Drops the stale `email_1` unique index from the users collection.
 * This index was created by an older schema version and prevents creating
 * multiple users without email (null value collision).
 * Protected by SEED_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        const { secret } = await req.json();
        if (!secret || secret !== process.env.SEED_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            return NextResponse.json({ error: "Database not connected" }, { status: 500 });
        }
        const collection = db.collection("users");

        // List current indexes
        const indexes = await collection.indexes();
        const indexNames = indexes.map((idx: any) => idx.name);

        // Drop the stale email_1 index if it exists
        const results: string[] = [];
        if (indexNames.includes("email_1")) {
            await collection.dropIndex("email_1");
            results.push("Dropped stale 'email_1' unique index");
        } else {
            results.push("'email_1' index not found — already clean");
        }

        // List indexes after cleanup
        const finalIndexes = await collection.indexes();

        return NextResponse.json({
            success: true,
            results,
            currentIndexes: finalIndexes.map((idx: any) => ({
                name: idx.name,
                keys: idx.key,
                unique: idx.unique || false,
                sparse: idx.sparse || false,
            })),
        });
    } catch (error: any) {
        console.error("fix-email-index error:", error);
        return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
    }
}
