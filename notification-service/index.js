const express = require("express");
const amqp = require("amqplib");

const app = express();

const PORT = process.env.PORT || 3003;

let channel, connection;

async function connectToRabbitMQ(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Connected to RabbitMQ");
      consumeTaskEvents();
      return;
    } catch (err) {
      console.error("RabbitMQ connection error:", err);
      retries--;
      console.log("Retrying in", delay / 1000, "seconds...");
      await new Promise((res) => {
        setTimeout(res, delay);
      });
    }
  }
  console.error("Failed to connect to RabbitMQ after retries");
}

async function consumeTaskEvents() {
  try {
    await channel.consume("task_created", (message) => {
      if (message) {
        const task = JSON.parse(message.content.toString());
        console.log("📧 Notification: Task created -", task);
        console.log(`   Task ID: ${task.taskId}, User ID: ${task.userId}, Title: ${task.title}`);
        // Here you would send email, SMS, push notification, etc.
        channel.ack(message);
      }
    });
    console.log("Listening for task_created events...");
  } catch (err) {
    console.error("Error consuming messages:", err);
  }
}

app.get("/", (req, res) => {
  res.send("Notification Service is running");
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
  connectToRabbitMQ();
});
