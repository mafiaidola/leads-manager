/**
 * @route GET /api/whatsapp/webhook — Meta webhook verification (hub.challenge)
 * @route POST /api/whatsapp/webhook — Receives incoming WhatsApp messages
 * @description Webhook endpoint for WhatsApp Business API message delivery.
 */
import { NextRequest, NextResponse } from "next/server";

/**
 * WhatsApp webhook handler.
 * GET  — webhook verification (hub.challenge)
 * POST — delivery receipts and incoming message notifications
 */

// Webhook verification
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
        console.log("✅ WhatsApp webhook verified");
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
}

// Incoming webhook events (message status updates, incoming messages)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Process status updates (sent, delivered, read)
        const entries = body.entry || [];
        for (const entry of entries) {
            const changes = entry.changes || [];
            for (const change of changes) {
                const value = change.value;

                // Message status updates
                if (value.statuses) {
                    for (const status of value.statuses) {
                        console.log(
                            `📱 WA Status: ${status.id} → ${status.status} (to: ${status.recipient_id})`
                        );
                    }
                }

                // Incoming messages (could be used for auto-replies in the future)
                if (value.messages) {
                    for (const msg of value.messages) {
                        console.log(
                            `📩 WA Incoming: from ${msg.from}, type: ${msg.type}`
                        );
                    }
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ status: "ok" }); // Always return 200 to Meta
    }
}
