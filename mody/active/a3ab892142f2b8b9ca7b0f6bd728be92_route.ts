•/**
 * Individual Discount API
 * 
 * GET - Get a single discount
 * PATCH - Update a discount
 * DELETE - Delete a discount
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getAuthContext, apiSuccess, apiError, ERROR_CODES } from "@/lib/api/response";
import { getDiscountById, updateDiscount, deleteDiscount } from "@/lib/services/discount.service";

interface RouteParams {
    params: Promise<{ id: string }>;
}

const updateDiscountSchema = z.object({
    code: z.string().min(3).optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
    value: z.number().min(0).optional(),
    minOrderAmount: z.number().optional(),
    maxDiscountAmount: z.number().optional(),
    usageLimit: z.number().optional(),
    perCustomerLimit: z.number().optional(),
    startsAt: z.string().nullable().optional(),
    endsAt: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});

/**
 * GET /api/discounts/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const authResult = await getAuthContext(() => cookies());
        if ('error' in authResult) return authResult.error;
        const { storeId } = authResult.auth;

        const supabase = createAdminClient();
        const result = await getDiscountById(supabase, storeId, id);

        if ('error' in result && result.status) {
            return apiError(result.error, result.status, ERROR_CODES.NOT_FOUND);
        }

        return apiSuccess(result.data);
    } catch (error) {
        logger.error('GET /api/discounts/[id] error', error);
        return apiError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
}

/**
 * PATCH /api/discounts/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const authResult = await getAuthContext(() => cookies());
        if ('error' in authResult) return authResult.error;
        const { storeId, userId } = authResult.auth;

        const body = await request.json();
        const validation = updateDiscountSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation error',
                details: validation.error.issues,
            }, { status: 400 });
        }

        const supabase = createAdminClient();
        const result = await updateDiscount(supabase, storeId, id, validation.data, userId || '');

        if ('error' in result && result.status) {
            return apiError(result.error, result.status, ERROR_CODES.VALIDATION_ERROR);
        }

        return apiSuccess(result.data);
    } catch (error) {
        logger.error('PATCH /api/discounts/[id] error', error);
        return apiError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
}

/**
 * DELETE /api/discounts/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const authResult = await getAuthContext(() => cookies());
        if ('error' in authResult) return authResult.error;
        const { storeId, userId } = authResult.auth;

        const supabase = createAdminClient();
        const result = await deleteDiscount(supabase, storeId, id, userId || '');

        if ('error' in result && result.status) {
            return apiError(result.error, result.status, ERROR_CODES.NOT_FOUND);
        }

        return apiSuccess(result.data);
    } catch (error) {
        logger.error('DELETE /api/discounts/[id] error', error);
        return apiError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
}
•"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72›file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/api/discounts/%5Bid%5D/route.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version