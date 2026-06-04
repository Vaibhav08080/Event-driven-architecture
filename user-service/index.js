const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model("User", UserSchema);

// Create User
app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = new User({
      name,
      email,
    });

    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Error" });
  }
});

// Get All Users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Error" });
  }
});

// Home Route
app.get("/", (req, res) => {
  res.send("Hello!");
});

const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose
  .connect("mongodb://mongo:27017/users")
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Error:", err);
  });