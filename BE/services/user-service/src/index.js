const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "../.env" }); 

const app = express();
app.use(cors({
  origin: "*",
}));
app.use(express.json());

const userRoutes = require("./routes/userRouters");
app.use("/user", userRoutes);

// Khởi động server
const PORT = process.env.PORT || 3824;
app.listen(PORT, () => {
    console.log(`User service đang chạy trên cổng ${PORT}`);
});
