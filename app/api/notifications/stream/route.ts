/**
 * @route GET /api/notifications/stream
 * @description Server-Sent Events (SSE) endpoint for real-time notifications.
 *
 * Polls MongoDB every 10s for notifications (unread + recent read).
 * Auto-closes after 55s (under Vercel's 60s limit) — client EventSource auto-reconnects.
 * Org-scoped and user-scoped via session.
 */
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Poll interval in ms — how often the SSE stream queries DB for new notifications
const POLL_INTERVAL = 10000; // 10 seconds
// How long to keep the stream open before client must reconnect
const STREAM_TIMEOUT = 55000; // 55 seconds (under Vercel's 60s max)

export async function GET() {
    const session = await auth();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;
    const orgId = (session.user as any).orgId;

    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                if (isClosed) return;
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                    );
                } catch {
                    isClosed = true;
                }
            };

            // Send initial ping so client knows connection is alive
            send({ type: "ping" });

            const poll = async () => {
                if (isClosed) return;
                try {
                    await dbConnect();
                    const filter: any = { userId };
                    if (orgId) filter.orgId = orgId;

                    // Get all notifications (unread + recent read), limited to 50
                    const allNotifications = await Notification.find(filter)
                        .sort({ createdAt: -1 })
                        .limit(50)
                        .lean();

                    const unreadCount = allNotifications.filter((n: any) => !n.read).length;

                    send({
                        type: "notifications",
                        count: unreadCount,
                        notifications: allNotifications.map((n: any) => ({
                            _id: n._id.toString(),
                            type: n.type,
                            title: n.title,
                            message: n.message,
                            leadId: n.leadId?.toString() || null,
                            read: n.read,
                            createdAt: n.createdAt.toISOString(),
                        })),
                    });
                } catch (err) {
                    console.error("SSE poll error:", err);
                }
            };

            // First poll immediately
            await poll();

            // Then poll every POLL_INTERVAL ms
            const pollTimer = setInterval(poll, POLL_INTERVAL);

            // Close the stream after STREAM_TIMEOUT — client EventSource will auto-reconnect
            const closeTimer = setTimeout(() => {
                isClosed = true;
                clearInterval(pollTimer);
                try { controller.close(); } catch { /* already closed */ }
            }, STREAM_TIMEOUT);

            // Cleanup on stream cancel
            return () => {
                isClosed = true;
                clearInterval(pollTimer);
                clearTimeout(closeTimer);
            };
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
