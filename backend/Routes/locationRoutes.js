
const express = require("express");
const router = express.Router();

const BusLocation = require("../models/BusLocation");
const normalizeBusNumber = require("../utils/normalizeBusNumber");

// =====================================================
// UPDATE BUS LOCATION
// =====================================================

router.post("/update", async (req, res) => {
    try {
        const {
            busNumber,
            latitude,
            longitude,
            routeStart,
            routeEnd
        } = req.body;

        const normalizedBusNumber = normalizeBusNumber(busNumber);
        const parsedLatitude = Number(latitude);
        const parsedLongitude = Number(longitude);

        if (
            !normalizedBusNumber ||
            !Number.isFinite(parsedLatitude) ||
            !Number.isFinite(parsedLongitude)
        ) {
            return res.status(400).json({
                message:
                    "Bus number, latitude and longitude are required"
            });
        }

        if (
            parsedLatitude < -90 ||
            parsedLatitude > 90 ||
            parsedLongitude < -180 ||
            parsedLongitude > 180
        ) {
            return res.status(400).json({
                message:
                    "Latitude must be between -90 and 90 and longitude must be between -180 and 180"
            });
        }

        const cleanRouteStart = typeof routeStart === "string"
            ? routeStart.trim()
            : "";

        const cleanRouteEnd = typeof routeEnd === "string"
            ? routeEnd.trim()
            : "";

        const location = await BusLocation.findOneAndUpdate(
            { busNumber: normalizedBusNumber },
            {
                $set: {
                    busNumber: normalizedBusNumber,
                    latitude: parsedLatitude,
                    longitude: parsedLongitude,
                    routeStart: cleanRouteStart,
                    routeEnd: cleanRouteEnd,
                    updatedAt: new Date()
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({
            message:
                "Bus location updated successfully",

            location
        });

    } catch (error) {

        console.error(
            "Location update error:",
            error
        );

        res.status(500).json({
            message:
                "Error updating bus location",

            error: error.message
        });
    }
});


// =====================================================
// GET BUS LOCATION
// =====================================================

router.get("/:busNumber", async (req, res) => {
    try {

        const normalizedBusNumber = normalizeBusNumber(req.params.busNumber);

        if (!normalizedBusNumber) {
            return res.status(400).json({
                message: "Bus number is required"
            });
        }

        const location = await BusLocation.findOne({
            busNumber: normalizedBusNumber
        });

        if (!location) {
            return res.status(404).json({
                message:
                    "Bus location not found"
            });
        }

        res.status(200).json(location);

    } catch (error) {

        console.error(
            "Get location error:",
            error
        );

        res.status(500).json({
            message:
                "Error getting bus location",

            error: error.message
        });
    }
});


module.exports = router;

