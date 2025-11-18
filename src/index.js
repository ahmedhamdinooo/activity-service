import express from "express";
import dotenv from "dotenv";
import activityRoutes from "./interfaces/http/activity.routes.js";
import { initProducer } from "./infrastructure/kafka/producer.js";
import { connectMongoDB } from "./infrastructure/db/mongo.js";

dotenv.config();

const app = express();

app.use(express.json());

// API routes
app.use("/api", activityRoutes);

// Start app
const PORT = process.env.PORT || 3000;

async function start() {
    await connectMongoDB();
    await initProducer();

    app.listen(PORT, () => {
        console.log(`🚀 API running on port ${PORT}`);
    });
}

start();
