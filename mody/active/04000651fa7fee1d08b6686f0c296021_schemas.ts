ô-/**
 * API Validation Schemas
 * 
 * Centralized Zod schemas for API request validation.
 * 
 * @module @/lib/api/schemas
 * 
 * Golden Rules Compliance:
 * - Rule 3: Under 200 lines âœ…
 * - DRY principle: Centralized validation âœ…
 */

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Common Patterns
// -----------------------------------------------------------------------------

/** Subdomain format: lowercase letters, numbers, hyphens, min 3 chars */
const subdomainSchema = z
    .string()
    .min(3, 'Store URL must be at least 3 characters')
    .max(63, 'Store URL must be 63 characters or less')
    .regex(
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
        'Store URL can only contain lowercase letters, numbers, and hyphens. Must start and end with a letter or number.'
    );

/** UUID format */
const uuidSchema = z.string().uuid('Invalid ID format');

/** Hex color format */
const hexColorSchema = z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format like #1B365D');

// -----------------------------------------------------------------------------
// Store Schemas
// -----------------------------------------------------------------------------

export const storeSchemas = {
    /** POST /api/stores - Create new store */
    create: z.object({
        name: z
            .string()
            .min(2, 'Store name must be at least 2 characters')
            .max(100, 'Store name must be 100 characters or less'),
        subdomain: subdomainSchema,
        category: z.string().optional(),
        template_id: z.string().optional().nullable(),
        store_type: z.enum(['ecommerce', 'funnel', 'website']).optional(),
        owner_first_name: z.string().max(50).optional(),
        owner_last_name: z.string().max(50).optional(),
        plan: z.enum(['free', 'pro']).optional(),
    }),

    /** PATCH /api/stores/[id]/settings - Update settings */
    updateSettings: z.object({
        theme: z.object({
            primaryColor: hexColorSchema.optional(),
            secondaryColor: hexColorSchema.optional(),
            fontFamily: z.string().optional(),
        }).optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
        headerConfig: z.record(z.string(), z.unknown()).optional(),
        footerConfig: z.record(z.string(), z.unknown()).optional(),
        homeSections: z.array(z.unknown()).optional(),
    }),

    /** PUT /api/stores/[id]/settings - Full replacement (template apply) */
    replaceSettings: z.object({
        theme: z.object({
            primaryColor: hexColorSchema.optional(),
            secondaryColor: hexColorSchema.optional(),
            fontFamily: z.string().optional(),
        }).optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
        puckData: z.record(z.string(), z.unknown()).optional(),
    }),
};

// -----------------------------------------------------------------------------
// Product Schemas
// -----------------------------------------------------------------------------

export const productSchemas = {
    /** POST /api/products - Create product */
    create: z.object({
        name: z.string().min(1, 'Product name is required').max(255),
        name_ar: z.string().max(255).optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        description_ar: z.string().optional(),
        price: z.number().min(0, 'Price must be positive'),
        compare_at_price: z.number().min(0).optional(),
        cost_per_item: z.number().min(0).optional(),
        sku: z.string().max(100).optional(),
        barcode: z.string().max(100).optional(),
        track_inventory: z.boolean().optional(),
        quantity: z.number().int().min(0).optional(),
        category_id: uuidSchema.optional().nullable(),
        status: z.enum(['active', 'draft', 'archived']).optional(),
    }),

    /** PATCH /api/products/[id] - Update product */
    update: z.object({
        name: z.string().min(1).max(255).optional(),
        name_ar: z.string().max(255).optional(),
        description: z.string().optional(),
        description_ar: z.string().optional(),
        price: z.number().min(0).optional(),
        compare_at_price: z.number().min(0).optional().nullable(),
        cost_per_item: z.number().min(0).optional().nullable(),
        sku: z.string().max(100).optional(),
        barcode: z.string().max(100).optional(),
        track_inventory: z.boolean().optional(),
        quantity: z.number().int().min(0).optional(),
        category_id: uuidSchema.optional().nullable(),
        status: z.enum(['active', 'draft', 'archived']).optional(),
    }),
};

// -----------------------------------------------------------------------------
// Chat Schemas
// -----------------------------------------------------------------------------

export const chatSchemas = {
    /** PATCH /api/chat/settings - Update chat settings */
    updateSettings: z.object({
        widget_enabled: z.boolean().optional(),
        widget_color: hexColorSchema.optional(),
        widget_position: z.enum(['bottom-right', 'bottom-left']).optional(),
        welcome_message: z.string().max(500).optional(),
        welcome_message_ar: z.string().max(500).optional(),
        offline_message: z.string().max(500).optional(),
        offline_message_ar: z.string().max(500).optional(),
        ai_enabled: z.boolean().optional(),
        ai_handoff_threshold: z.number().min(0).max(1).optional(),
    }),
};

// -----------------------------------------------------------------------------
// Export all schemas
// -----------------------------------------------------------------------------

export const schemas = {
    store: storeSchemas,
    product: productSchemas,
    chat: chatSchemas,
};

export default schemas;
ô-*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72Šfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/lib/api/schemas.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version