import { connectMongoDB } from "../../infrastructure/db/mongo.js";
import { startConsumer } from "../../infrastructure/kafka/consumer.js";

(async () => {
    await connectMongoDB();
    await startConsumer();
})();
