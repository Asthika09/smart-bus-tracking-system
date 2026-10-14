const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const locationRoutes = require("./Routes/locationRoutes");
const stopRoutes = require("./Routes/stopRoutes");
const authRoutes = require("./Routes/authRoutes");
const busRoutes = require("./Routes/busRoutes");
const routeRoutes = require("./Routes/routeRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/location", locationRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/routes", routeRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Smart Bus Tracking API is running"
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(process.env.PORT, () => {
            console.log(
                `Server running on http://localhost:${process.env.PORT}`
            );
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed:", err.message);
    });