/**
 * Recursively serializes Mongoose lean documents into plain JSON-safe objects.
 * Converts ObjectIds to strings and Dates to ISO strings so they can be
 * safely passed from Server Components to Client Components without
 * JSON.parse(JSON.stringify(...)).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T>(data: T): T {
    if (data === null || data === undefined) return data;

    // Handle Date → ISO string
    if (data instanceof Date) return data.toISOString() as unknown as T;

    // Handle ObjectId (has toHexString method)
    if (typeof data === "object" && "toHexString" in data && typeof (data as any).toHexString === "function") {
        return (data as any).toHexString() as unknown as T;
    }

    // Handle arrays
    if (Array.isArray(data)) {
        return data.map((item) => serialize(item)) as unknown as T;
    }

    // Handle plain objects
    if (typeof data === "object") {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(data)) {
            result[key] = serialize((data as Record<string, unknown>)[key]);
        }
        return result as T;
    }

    // Primitives (string, number, boolean) pass through
    return data;
}
