import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Initiates Meta OAuth flow for WhatsApp Business API.
 * Redirects user to Facebook login dialog with WhatsApp scopes.
 */
export async function GET() {
    const session = await auth();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const appId = process.env.META_APP_ID;
    if (!appId) {
        return NextResponse.json(
            { error: "META_APP_ID not configured" },
            { status: 500 }
        );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/whatsapp/callback`;
    const scopes = "whatsapp_business_management,whatsapp_business_messaging";
    const state = session.user.id; // Pass user ID as state for callback

    const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    return NextResponse.redirect(authUrl.toString());
}
