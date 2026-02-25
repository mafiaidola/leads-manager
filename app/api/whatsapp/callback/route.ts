import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WhatsAppConfig from "@/models/WhatsAppConfig";

const META_API = "https://graph.facebook.com/v21.0";

/**
 * Meta OAuth callback — exchanges auth code for access token,
 * fetches WABA ID and phone number, saves config.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (error || !code || !state) {
        return NextResponse.redirect(
            `${baseUrl}/settings?wa_error=${encodeURIComponent(error || "Missing authorization code")}`
        );
    }

    try {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        const redirectUri = `${baseUrl}/api/whatsapp/callback`;

        // Step 1: Exchange code for short-lived token
        const tokenRes = await fetch(
            `${META_API}/oauth/access_token?` +
            `client_id=${appId}&` +
            `client_secret=${appSecret}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `code=${code}`
        );
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            console.error("Token exchange failed:", tokenData);
            return NextResponse.redirect(`${baseUrl}/settings?wa_error=Token exchange failed`);
        }

        // Step 2: Exchange for long-lived token
        const longTokenRes = await fetch(
            `${META_API}/oauth/access_token?` +
            `grant_type=fb_exchange_token&` +
            `client_id=${appId}&` +
            `client_secret=${appSecret}&` +
            `fb_exchange_token=${tokenData.access_token}`
        );
        const longTokenData = await longTokenRes.json();
        const accessToken = longTokenData.access_token || tokenData.access_token;

        // Step 3: Get WABA ID
        const wabaRes = await fetch(
            `${META_API}/me/businesses?access_token=${accessToken}`
        );
        const wabaData = await wabaRes.json();

        // Step 4: Get WhatsApp Business Account
        const debugRes = await fetch(
            `${META_API}/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
        );
        const debugData = await debugRes.json();

        // Step 5: Try to get phone numbers from WABA
        let phoneNumberId = "";
        let displayPhone = "";
        let wabaId = "";

        // Try finding WABA through shared WABAs
        try {
            const sharedWabaRes = await fetch(
                `${META_API}/me?fields=businesses{owned_whatsapp_business_accounts}&access_token=${accessToken}`
            );
            const sharedWabaData = await sharedWabaRes.json();

            // Traverse to find WABA ID
            const businesses = sharedWabaData?.businesses?.data || [];
            for (const biz of businesses) {
                const wabas = biz?.owned_whatsapp_business_accounts?.data || [];
                if (wabas.length > 0) {
                    wabaId = wabas[0].id;
                    break;
                }
            }

            // If we found a WABA, get phone numbers
            if (wabaId) {
                const phonesRes = await fetch(
                    `${META_API}/${wabaId}/phone_numbers?access_token=${accessToken}`
                );
                const phonesData = await phonesRes.json();
                if (phonesData.data && phonesData.data.length > 0) {
                    phoneNumberId = phonesData.data[0].id;
                    displayPhone = phonesData.data[0].display_phone_number || "";
                }
            }
        } catch (e) {
            console.error("Failed to fetch WABA phone numbers:", e);
        }

        // Save to database
        await dbConnect();
        await WhatsAppConfig.findOneAndUpdate(
            { userId: state },
            {
                accessToken,
                phoneNumberId: phoneNumberId || "pending_setup",
                wabaId: wabaId || "pending_setup",
                displayPhone: displayPhone || "Pending setup",
                connected: true,
                connectedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        return NextResponse.redirect(`${baseUrl}/settings?wa_success=1`);
    } catch (error) {
        console.error("WhatsApp callback error:", error);
        return NextResponse.redirect(`${baseUrl}/settings?wa_error=Connection failed`);
    }
}
