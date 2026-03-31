/**
 * @module lib/actions/salesQuality
 * @description Deep analytics server action for the Quality dashboard.
 * Provides per-user, per-product, and per-period sales quality data
 * with price comparison analytics (product price vs. user price).
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import User, { USER_ROLES } from "@/models/User";
import Organization from "@/models/Organization";
import mongoose from "mongoose";

export interface SalesQualityFilters {
    period: "daily" | "weekly" | "monthly" | "annually";
    dateFrom?: string;
    dateTo?: string;
    userIds?: string[];
    productKey?: string;
}

export interface UserQualityRow {
    userId: string;
    userName: string;
    userRole: string;
    totalLeads: number;
    conversions: number;
    conversionRate: number;
    totalProductPrice: number;
    totalCustomPrice: number;
    totalDiscount: number;
    discountPct: number;
    margin: number;
    avgDealSize: number;
}

export interface ProductQualityRow {
    productKey: string;
    productLabel: string;
    unitsSold: number;
    basePrice: number;
    avgUserPrice: number;
    avgDiscount: number;
    totalRevenue: number;
}

export interface PeriodBucket {
    label: string;
    dateKey: string;
    leads: number;
    conversions: number;
    revenue: number;
    avgDiscount: number;
}

export interface SalesQualityData {
    summary: {
        totalLeads: number;
        totalConversions: number;
        conversionRate: number;
        totalProductPrice: number;
        totalCustomPrice: number;
        totalMargin: number;
        avgDiscountPct: number;
        currency: string;
    };
    users: UserQualityRow[];
    products: ProductQualityRow[];
    periods: PeriodBucket[];
}

export async function getSalesQuality(filters: SalesQualityFilters): Promise<SalesQualityData | null> {
    const session = await auth();
    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== "IQA")) {
        return null;
    }

    await dbConnect();
    const orgId = session.user.orgId;

    // Get org settings for product labels and sale statuses
    const org = await Organization.findById(orgId)
        .select("settings.products settings.statuses settings.defaultCurrency")
        .lean() as any;

    const currency = org?.settings?.defaultCurrency || "AED";
    const productMap: Record<string, { label: string; price: number }> = {};
    (org?.settings?.products || []).forEach((p: any) => {
        productMap[p.key] = { label: p.label, price: p.price || 0 };
    });

    // Determine sale statuses
    const saleStatusKeys = (org?.settings?.statuses || [])
        .filter((s: any) => s.isSaleStatus)
        .map((s: any) => s.key);

    // Build date range
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = filters.dateTo ? new Date(filters.dateTo) : now;
    dateTo.setHours(23, 59, 59, 999);

    if (filters.dateFrom) {
        dateFrom = new Date(filters.dateFrom);
    } else {
        switch (filters.period) {
            case "daily":
                dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case "weekly":
                dateFrom = new Date(now);
                dateFrom.setDate(dateFrom.getDate() - 7);
                break;
            case "monthly":
                dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case "annually":
                dateFrom = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        }
    }

    // Build match query
    const matchQuery: any = {
        orgId: new mongoose.Types.ObjectId(orgId as string),
        createdAt: { $gte: dateFrom, $lte: dateTo },
        deletedAt: null,
    };

    if (filters.userIds && filters.userIds.length > 0) {
        matchQuery.assignedTo = {
            $in: filters.userIds.map(id => {
                try { return new mongoose.Types.ObjectId(id); } catch { return id; }
            })
        };
    }
    if (filters.productKey && filters.productKey !== "all") {
        matchQuery.product = filters.productKey;
    }

    // Fetch all matching leads
    const leads = await Lead.find(matchQuery)
        .select("assignedTo status product productPrice customPrice createdAt")
        .populate("assignedTo", "name role")
        .lean() as any[];

    // Get all users for this org
    const orgUsers = await User.find({ orgId, active: true })
        .select("name role")
        .lean() as any[];

    const userMap: Record<string, { name: string; role: string }> = {};
    orgUsers.forEach(u => {
        userMap[u._id.toString()] = { name: u.name, role: u.role };
    });

    // ── Per-user aggregation ──
    const userAgg: Record<string, {
        totalLeads: number; conversions: number;
        totalProductPrice: number; totalCustomPrice: number;
    }> = {};

    // ── Per-product aggregation ──
    const productAgg: Record<string, {
        unitsSold: number; totalUserPrice: number; totalBasePrice: number;
    }> = {};

    // ── Period bucketing ──
    const periodAgg: Record<string, {
        leads: number; conversions: number; revenue: number; discountSum: number;
    }> = {};

    let totalLeads = 0;
    let totalConversions = 0;
    let totalProductPrice = 0;
    let totalCustomPrice = 0;

    for (const lead of leads) {
        totalLeads++;
        const userId = lead.assignedTo?._id?.toString() || "unassigned";
        const isSale = saleStatusKeys.includes(lead.status);

        // User agg
        if (!userAgg[userId]) {
            userAgg[userId] = { totalLeads: 0, conversions: 0, totalProductPrice: 0, totalCustomPrice: 0 };
        }
        userAgg[userId].totalLeads++;
        if (isSale) {
            userAgg[userId].conversions++;
            totalConversions++;
        }
        if (lead.productPrice != null) {
            userAgg[userId].totalProductPrice += Number(lead.productPrice);
            totalProductPrice += Number(lead.productPrice);
        }
        if (lead.customPrice != null) {
            userAgg[userId].totalCustomPrice += Number(lead.customPrice);
            totalCustomPrice += Number(lead.customPrice);
        }

        // Product agg (only for leads with a product)
        if (lead.product && isSale) {
            if (!productAgg[lead.product]) {
                productAgg[lead.product] = { unitsSold: 0, totalUserPrice: 0, totalBasePrice: 0 };
            }
            productAgg[lead.product].unitsSold++;
            productAgg[lead.product].totalUserPrice += Number(lead.customPrice || 0);
            productAgg[lead.product].totalBasePrice += Number(lead.productPrice || productMap[lead.product]?.price || 0);
        }

        // Period bucketing
        const d = new Date(lead.createdAt);
        let bucketKey: string;
        switch (filters.period) {
            case "daily":
                bucketKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                break;
            case "weekly": {
                const weekStart = new Date(d);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                bucketKey = `W ${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
                break;
            }
            case "monthly":
                bucketKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                break;
            case "annually":
                bucketKey = `${d.getFullYear()}`;
                break;
            default:
                bucketKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        if (!periodAgg[bucketKey]) {
            periodAgg[bucketKey] = { leads: 0, conversions: 0, revenue: 0, discountSum: 0 };
        }
        periodAgg[bucketKey].leads++;
        if (isSale) {
            periodAgg[bucketKey].conversions++;
            periodAgg[bucketKey].revenue += Number(lead.customPrice || 0);
        }
        if (lead.productPrice != null && lead.customPrice != null) {
            periodAgg[bucketKey].discountSum += Number(lead.productPrice) - Number(lead.customPrice);
        }
    }

    // Build user rows
    const users: UserQualityRow[] = Object.entries(userAgg).map(([userId, data]) => {
        const info = userMap[userId] || { name: "Unassigned", role: "-" };
        const discount = data.totalProductPrice - data.totalCustomPrice;
        const discountPct = data.totalProductPrice > 0 ? (discount / data.totalProductPrice) * 100 : 0;
        return {
            userId,
            userName: info.name,
            userRole: info.role,
            totalLeads: data.totalLeads,
            conversions: data.conversions,
            conversionRate: data.totalLeads > 0 ? parseFloat(((data.conversions / data.totalLeads) * 100).toFixed(1)) : 0,
            totalProductPrice: data.totalProductPrice,
            totalCustomPrice: data.totalCustomPrice,
            totalDiscount: discount,
            discountPct: parseFloat(discountPct.toFixed(1)),
            margin: data.totalCustomPrice - data.totalProductPrice,
            avgDealSize: data.conversions > 0 ? Math.round(data.totalCustomPrice / data.conversions) : 0,
        };
    }).sort((a, b) => b.conversions - a.conversions);

    // Build product rows
    const products: ProductQualityRow[] = Object.entries(productAgg).map(([key, data]) => {
        const info = productMap[key] || { label: key, price: 0 };
        return {
            productKey: key,
            productLabel: info.label,
            unitsSold: data.unitsSold,
            basePrice: info.price,
            avgUserPrice: data.unitsSold > 0 ? Math.round(data.totalUserPrice / data.unitsSold) : 0,
            avgDiscount: data.unitsSold > 0
                ? parseFloat(((data.totalBasePrice - data.totalUserPrice) / data.totalBasePrice * 100).toFixed(1))
                : 0,
            totalRevenue: data.totalUserPrice,
        };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Build period rows
    const periods: PeriodBucket[] = Object.entries(periodAgg)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => ({
            label: key,
            dateKey: key,
            leads: data.leads,
            conversions: data.conversions,
            revenue: data.revenue,
            avgDiscount: data.leads > 0 ? parseFloat((data.discountSum / data.leads).toFixed(1)) : 0,
        }));

    const totalMargin = totalCustomPrice - totalProductPrice;
    const avgDiscountPct = totalProductPrice > 0
        ? parseFloat(((totalProductPrice - totalCustomPrice) / totalProductPrice * 100).toFixed(1))
        : 0;

    return {
        summary: {
            totalLeads,
            totalConversions,
            conversionRate: totalLeads > 0 ? parseFloat(((totalConversions / totalLeads) * 100).toFixed(1)) : 0,
            totalProductPrice,
            totalCustomPrice,
            totalMargin,
            avgDiscountPct,
            currency,
        },
        users,
        products,
        periods,
    };
}
