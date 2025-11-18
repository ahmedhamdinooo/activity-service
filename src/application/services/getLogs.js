import { Activity } from "../../domain/models/Activity.js";

export async function getLogs({ userId, page = 1, limit = 20 }) {
    const query = {};

    if (userId) query.userId = userId;

    const skip = (page - 1) * limit;

    const logs = await Activity.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Activity.countDocuments(query);

    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        logs
    };
}
