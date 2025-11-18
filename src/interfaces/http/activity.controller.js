import { sendActivityEvent } from "../../infrastructure/kafka/producer.js";
import { getLogs } from "../../application/services/getLogs.js";

export async function postActivity(req, res) {
    try {
        const activity = req.body;

        await sendActivityEvent(activity);

        return res.status(200).json({
            message: "Activity event sent to Kafka",
        });

    } catch (err) {
        console.error("❌ postActivity Error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function fetchLogs(req, res) {
    try {
        const { userId, page, limit } = req.query;

        const result = await getLogs({
            userId,
            page: Number(page) || 1,
            limit: Number(limit) || 20,
        });

        return res.status(200).json(result);

    } catch (err) {
        console.error("❌ fetchLogs Error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}
