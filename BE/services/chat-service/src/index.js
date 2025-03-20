const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
require("dotenv").config({ path: "../.env" }); 

const app = express();
const PORT = 3618;

AWS.config.update({
    region: process.env.AWS_REGION || "ap-southeast-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.use(express.json());
app.use(cors());

const conversationRoutes = require("./routers/conversationRouter");
const chatRoomRoutes =require("./routers/ChatRoomRouter");
app.use("/", conversationRoutes);
app.use("/", chatRoomRoutes);
app.get("/check", (req, res) => {
    res.send("Chat Service API is running...");
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
