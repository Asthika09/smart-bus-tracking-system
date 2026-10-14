const express = require("express");
const router = express.Router();

const Stop = require("../models/Stop");

// Add a bus stop
router.post("/", async (req, res) => {
    try {
        const { name, latitude, longitude, routeName } = req.body;

        const stop = new Stop({
            name,
            latitude,
            longitude,
            routeName
        });

        const savedStop = await stop.save();

        res.status(201).json({
            message: "Bus stop added successfully",
            stop: savedStop
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding bus stop",
            error: error.message
        });
    }
});

// Get all bus stops
router.get("/", async (req, res) => {
    try {
        const stops = await Stop.find();

        res.json(stops);

    } catch (error) {
        res.status(500).json({
            message: "Error getting bus stops",
            error: error.message
        });
    }
});

module.exports = router;