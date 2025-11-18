import { ActivityRepository } from "../../infrastructure/db/activityRepo.js";

const activityRepo = new ActivityRepository();

export async function processActivity(activityData) {
    try {
        // Validate minimal data
        if (!activityData.userId || !activityData.type) {
            throw new Error("Invalid activity data");
        }

        return await activityRepo.createActivity({
            userId: activityData.userId,
            type: activityData.type,
            metadata: activityData.metadata || {},
            timestamp: activityData.timestamp || new Date()
        });

    } catch (err) {
        console.error("Error processing activity:", err.message);
        throw err;
    }
}
