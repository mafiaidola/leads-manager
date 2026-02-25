"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import WhatsAppConfig from "@/models/WhatsAppConfig";
import Lead from "@/models/Lead";
import LeadNote, { NOTE_TYPES } from "@/models/LeadNote";
import { USER_ROLES } from "@/models/User";

const META_API = "https://graph.facebook.com/v21.0";

/**
 * Get the current user's WhatsApp connection status.
 */
export async function getWhatsAppConfig() {
    const session = await auth();
    if (!session) return null;

    try {
        await dbConnect();
        const config = await WhatsAppConfig.findOne({ userId: session.user.id }).lean();
        if (!config) return null;
        return {
            connected: config.connected,
            displayPhone: config.displayPhone,
            phoneNumberId: config.phoneNumberId,
            connectedAt: config.connectedAt?.toISOString() || null,
        };
    } catch (error) {
        console.error("getWhatsAppConfig error:", error);
        return null;
    }
}

/**
 * Disconnect (remove) WhatsApp integration for the current user.
 */
export async function disconnectWhatsApp() {
    const session = await auth();
    if (!session) return { error: "Unauthorized" };

    try {
        await dbConnect();
        await WhatsAppConfig.deleteOne({ userId: session.user.id });
        return { success: true };
    } catch (error) {
        console.error("disconnectWhatsApp error:", error);
        return { error: "Failed to disconnect" };
    }
}

/**
 * Send a free-form text message via WhatsApp Cloud API.
 * Also logs the message as a LeadNote.
 */
export async function sendWhatsAppMessage(leadId: string, message: string) {
    const session = await auth();
    if (!session) return { error: "Unauthorized" };

    try {
        await dbConnect();

        // Get user's WA config
        const config = await WhatsAppConfig.findOne({ userId: session.user.id });
        if (!config || !config.connected) {
            return { error: "WhatsApp not connected. Go to Settings → WhatsApp to connect." };
        }

        // Get lead phone number
        const lead = await Lead.findById(leadId);
        if (!lead) return { error: "Lead not found" };
        if (!lead.phone) return { error: "Lead has no phone number" };

        // Format phone — must be international format without + (e.g. 971501234567)
        const phone = lead.phone.replace(/[^0-9]/g, "");
        if (phone.length < 10) return { error: "Invalid phone number" };

        // Send message via Meta API
        const response = await fetch(
            `${META_API}/${config.phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${config.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: phone,
                    type: "text",
                    text: { body: message },
                }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error("WhatsApp API error:", result);
            return { error: result.error?.message || "Failed to send message" };
        }

        // Log as LeadNote
        await LeadNote.create({
            leadId: lead._id,
            authorId: session.user.id,
            type: NOTE_TYPES.SYSTEM,
            message: `📱 WhatsApp: ${message}`,
        });

        // Update last contact
        lead.lastContactAt = new Date();
        lead.contactedToday = true;
        await lead.save();

        return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error) {
        console.error("sendWhatsAppMessage error:", error);
        return { error: "Failed to send WhatsApp message" };
    }
}

/**
 * Send a template message via WhatsApp Cloud API.
 */
export async function sendWhatsAppTemplate(
    leadId: string,
    templateName: string,
    languageCode: string = "en",
    parameters: string[] = []
) {
    const session = await auth();
    if (!session) return { error: "Unauthorized" };

    try {
        await dbConnect();

        const config = await WhatsAppConfig.findOne({ userId: session.user.id });
        if (!config || !config.connected) {
            return { error: "WhatsApp not connected. Go to Settings → WhatsApp to connect." };
        }

        const lead = await Lead.findById(leadId);
        if (!lead) return { error: "Lead not found" };
        if (!lead.phone) return { error: "Lead has no phone number" };

        const phone = lead.phone.replace(/[^0-9]/g, "");

        const templateBody: any = {
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template: {
                name: templateName,
                language: { code: languageCode },
            },
        };

        // Add parameters if provided
        if (parameters.length > 0) {
            templateBody.template.components = [
                {
                    type: "body",
                    parameters: parameters.map((p) => ({
                        type: "text",
                        text: p,
                    })),
                },
            ];
        }

        const response = await fetch(
            `${META_API}/${config.phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${config.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(templateBody),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            return { error: result.error?.message || "Failed to send template" };
        }

        await LeadNote.create({
            leadId: lead._id,
            authorId: session.user.id,
            type: NOTE_TYPES.SYSTEM,
            message: `📱 WhatsApp Template: ${templateName}`,
        });

        lead.lastContactAt = new Date();
        lead.contactedToday = true;
        await lead.save();

        return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error) {
        console.error("sendWhatsAppTemplate error:", error);
        return { error: "Failed to send template" };
    }
}
