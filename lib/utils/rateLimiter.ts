/**
 * @module lib/utils/rateLimiter
 * @description Simple in-memory rate limiter for serverless.
 * Uses a sliding window approach with IP-based tracking.
 * Note: In serverless environments, the store resets with each cold start.
 * For production-grade rate limiting, consider using Redis or Upstash.
 */

interface RateLimitEntry {
    attempts: number;
    firstAttempt: number;
    lastAttempt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // Max login attempts per window
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean old entries every 5 minutes

// Periodic cleanup to prevent memory leaks
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store.entries()) {
        if (now - entry.firstAttempt > WINDOW_MS) {
            store.delete(key);
        }
    }
}

/**
 * Check if an IP/key is rate limited.
 * @returns Object with `limited` boolean and `retryAfterMs` if limited.
 */
export function checkRateLimit(key: string): { limited: boolean; retryAfterMs?: number; remaining: number } {
    cleanup();
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
        // New window — reset
        store.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
        return { limited: false, remaining: MAX_ATTEMPTS - 1 };
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
        const retryAfterMs = WINDOW_MS - (now - entry.firstAttempt);
        return { limited: true, retryAfterMs, remaining: 0 };
    }

    entry.attempts++;
    entry.lastAttempt = now;
    return { limited: false, remaining: MAX_ATTEMPTS - entry.attempts };
}

/**
 * Reset rate limit for a key (e.g., after successful login).
 */
export function resetRateLimit(key: string) {
    store.delete(key);
}
