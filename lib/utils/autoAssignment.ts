/**
 * @module lib/utils/autoAssignment
 * @description Auto-assigns new leads to team members using round-robin
 * or least-loaded strategies. Configurable per-organization.
 *
 * Strategies:
 *  - round_robin: cycles through active users in order
 *  - least_loaded: assigns to user with fewest active leads
 *
 * Usage:
 *   const userId = await getAutoAssignee(orgId, "round_robin");
 */
"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Lead from "@/models/Lead";
import mongoose from "mongoose";

export type AssignmentStrategy = "round_robin" | "least_loaded" | "none";

// In-memory round-robin tracker (per-org)
const roundRobinIndex = new Map<string, number>();

/**
 * Get the next user to auto-assign a lead to.
 * Returns null if strategy is "none" or no eligible users found.
 */
export async function getAutoAssignee(
    orgId: string,
    strategy: AssignmentStrategy = "round_robin"
): Promise<string | null> {
    if (strategy === "none") return null;

    try {
        await dbConnect();

        // Get all active users eligible for assignment
        const users = await User.find({
            orgId: new mongoose.Types.ObjectId(orgId),
            active: true,
        })
            .select("_id name role")
            .sort({ role: 1, name: 1 })
            .lean();

        if (users.length === 0) return null;

        if (strategy === "round_robin") {
            const currentIndex = roundRobinIndex.get(orgId) || 0;
            const nextIndex = currentIndex % users.length;
            roundRobinIndex.set(orgId, nextIndex + 1);
            return (users[nextIndex] as any)._id.toString();
        }

        if (strategy === "least_loaded") {
            // Count active leads per user
            const leadCounts = await Lead.aggregate([
                {
                    $match: {
                        orgId: new mongoose.Types.ObjectId(orgId),
                        deletedAt: null,
                        assignedTo: { $in: users.map((u: any) => u._id) },
                    },
                },
                { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
            ]);

            const countMap = new Map<string, number>();
            leadCounts.forEach((item: any) => {
                countMap.set(item._id.toString(), item.count);
            });

            // Find user with least leads (including users with 0 leads)
            let minCount = Infinity;
            let minUser: string | null = null;

            for (const user of users) {
                const id = (user as any)._id.toString();
                const count = countMap.get(id) || 0;
                if (count < minCount) {
                    minCount = count;
                    minUser = id;
                }
            }

            return minUser;
        }

        return null;
    } catch (error) {
        console.error("Auto-assignment error:", error);
        return null;
    }
}
