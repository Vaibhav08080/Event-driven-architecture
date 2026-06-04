const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const amqp = require("amqplib")
const app = express();

app.use(bodyParser.json());

const PORT = process.env.PORT || 3002;

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId:Number,
  createdat:{
    type:Date,
    default:Date.now
  }
});

const Task = mongoose.model("Task", TaskSchema);

let channel , connection
async function ConnectToRabbitMqWithRetry(retries= 5 , delay=3000){
    while(retries){
        try{
            connection=await amqp.connect("amqp://rabbitmq")
            channel= await connection.createChannel()
            await channel.assertQueue("task_created")
            console.log("connected to rabbitMQ")
            return
        }
        catch(err){
            console.error("RabbitMq connection Error ", err)
            retries--;
            console.log("retrying again" , retries)
            await new Promise(res=>{
                setTimeout(res, delay)
            })

        }
    }
}

app.post("/tasks", async(req , res)=>{
    const { title , description , userId} = req.body;
    try{
        const task = new Task({title , description , userId})
        await task.save()
        const message = {taskId: task._id , userId , title};
        if (!channel){
            return res.status(503).json({Error:"Rabbit mq not connected"})
        }
        channel.sendToQueue("task_created" , Buffer.from(
            JSON.stringify(message)
        ))
        res.status(201).json(task)

    }
    catch(err){
        console.log("getting this err " , err)
        res.status(500).json({ error: "Failed to create task" })
    }
})


app.get("/tasks", async (req, res) => {
  try {
    const task = await Task.find();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal api error" });
  }
}); 
// home routes

app.get("/", (req, res) => {
  res.send("HEllo");
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/tasks";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB at", MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Task Service running on port ${PORT}`);
      ConnectToRabbitMqWithRetry()
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
