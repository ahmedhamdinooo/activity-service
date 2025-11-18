import { Kafka } from "kafkajs";
import { processActivity } from "../../application/services/processActivity.js";

const kafka = new Kafka({
  clientId: "activity-service-consumer",
  brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: "activity-group" });

export async function startConsumer() {
  await consumer.connect();
  console.log("🎯 Kafka Consumer Connected");

  await consumer.subscribe({
    topic: process.env.KAFKA_TOPIC,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      console.log("📥 Kafka event received:", data);
      await processActivity(data);
    },
  });
}
