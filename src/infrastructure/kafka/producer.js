import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "activity-service-producer",
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

export async function initProducer() {
  await producer.connect();
  console.log("🚀 Kafka Producer Connected");
}

export async function sendActivityEvent(activityData) {
  await producer.send({
    topic: process.env.KAFKA_TOPIC,
    messages: [{ value: JSON.stringify(activityData) }],
  });
  console.log("📤 Activity log sent → Kafka");
}
