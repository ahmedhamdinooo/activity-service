import { Activity } from "../../domain/models/Activity.js";

export class ActivityRepository {
    
    async createActivity(data) {
        const activity = new Activity(data);
        return await activity.save();
    }

    async getActivitiesByUser(userId, limit = 50) {
        return await Activity.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }

    async getAllActivities(limit = 100) {
        return await Activity.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }

}
