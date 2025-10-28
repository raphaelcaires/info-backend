import * as amqp from "amqplib";
import { PrismaClient } from "@prisma/client";

async function start() {
  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
  const queue = "vehicle_created";
  const prisma = new PrismaClient();

  const conn = await amqp.connect(rabbitUrl);
  const ch = await conn.createChannel();
  await ch.assertQueue(queue, { durable: true });
  console.log("Worker listening for messages on queue", queue);

  ch.consume(
    queue,
    async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log("Worker received:", payload);
      } catch (err) {
        console.error("Worker failed processing message", err);
      } finally {
        ch.ack(msg);
      }
    },
    { noAck: false }
  );
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
