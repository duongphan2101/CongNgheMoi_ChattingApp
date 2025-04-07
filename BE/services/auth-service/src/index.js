const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "../.env" }); 

const app = express();
app.use(cors());
app.use(express.json());

// Import route đăng nhập
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Khởi động server
const PORT = process.env.PORT || 3721;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Auth service đang chạy trên cổng ${PORT}`);
});
