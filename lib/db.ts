/**
 * @module lib/db
 * @description Cached Mongoose connection utility.
 *
 * Uses a global `mongoose.connection` cache to prevent connection growth during
 * Next.js development hot-reloads. Reads `DATABASE_URL` or `MONGODB_URI` from env.
 *
 * @example
 * ```ts
 * import { connectDB } from "@/lib/db";
 * await connectDB();
 * ```
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads

 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!MONGODB_URI) {
        throw new Error(
            "Please define the MONGODB_URI environment variable inside .env.local"
        );
    }

    if (!cached.promise) {

        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,                    // Production pool size
            serverSelectionTimeoutMS: 5000,     // 5s to find a server (fail faster)
            socketTimeoutMS: 45000,             // 45s socket timeout
            heartbeatFrequencyMS: 10000,        // Detect stale connections
            retryReads: true,
            retryWrites: true,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
