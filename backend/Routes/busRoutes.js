const express = require("express");
const router = express.Router();

const Bus = require("../models/Bus");
const BusLocation = require("../models/BusLocation");
const Route = require("../models/Route");
const normalizeBusNumber = require("../utils/normalizeBusNumber");

// ==========================================
// 1. ADD NEW BUS
// ==========================================
router.post("/", async (req, res) => {
    try {
        const { busNumber, driverName, route } = req.body;

        if (!busNumber || !driverName || !route) {
            return res.status(400).json({
                message: "Bus number, driver name and route are required"
            });
        }

        const normalizedBusNumber = normalizeBusNumber(busNumber);

        if (!normalizedBusNumber) {
            return res.status(400).json({
                message: "Bus number is invalid"
            });
        }

        const existingBus = await Bus.findOne({ busNumber: normalizedBusNumber });

        if (existingBus) {
            return res.status(409).json({
                message: "Bus number already exists"
            });
        }

        const routeExists = await Route.findById(route);

        if (!routeExists) {
            return res.status(404).json({
                message: "Route not found"
            });
        }

        const bus = await Bus.create({
            busNumber: normalizedBusNumber,
            driverName,
            route,
            status: "inactive"
        });

        const populatedBus = await Bus.findById(bus._id)
            .populate("route");

        return res.status(201).json({
            message: "Bus added successfully",
            bus: populatedBus
        });
    } catch (error) {
        console.error("Add bus error:", error);

        return res.status(500).json({
            message: "Error adding bus",
            error: error.message
        });
    }
});


// ==========================================
// 2. GET ALL BUSES
// ==========================================
router.get("/", async (req, res) => {
    try {
        const buses = await Bus.find().populate("route");

        return res.status(200).json(buses);
    } catch (error) {
        console.error("Get buses error:", error);

        return res.status(500).json({
            message: "Error fetching buses",
            error: error.message
        });
    }
});


// ==========================================
// 3. GET BUS BY BUS NUMBER
// ==========================================
router.get("/:busNumber", async (req, res) => {
    try {
        const normalizedBusNumber = normalizeBusNumber(req.params.busNumber);

        const bus = await Bus.findOne({
            busNumber: normalizedBusNumber
        }).populate("route");

        if (!bus) {
            return res.status(404).json({
                message: "Bus not found"
            });
        }

        return res.status(200).json(bus);
    } catch (error) {
        console.error("Get bus error:", error);

        return res.status(500).json({
            message: "Error fetching bus",
            error: error.message
        });
    }
});


// ==========================================
// 4. UPDATE BUS ROUTE
// ==========================================
router.put("/:busNumber/route", async (req, res) => {
    try {
        const { route } = req.body;
        const normalizedBusNumber = normalizeBusNumber(req.params.busNumber);

        if (!route) {
            return res.status(400).json({
                message: "Route ID is required"
            });
        }

        const routeExists = await Route.findById(route);

        if (!routeExists) {
            return res.status(404).json({
                message: "Route not found"
            });
        }

        const bus = await Bus.findOneAndUpdate(
            { busNumber: normalizedBusNumber },
            { $set: { route } },
            { new: true, runValidators: true }
        ).populate("route");

        if (!bus) {
            return res.status(404).json({
                message: "Bus not found"
            });
        }

        return res.status(200).json({
            message: "Bus route updated successfully",
            bus
        });
    } catch (error) {
        console.error("Update bus route error:", error);

        return res.status(500).json({
            message: "Error updating bus route",
            error: error.message
        });
    }
});


// ==========================================
// 5. START / END TRIP
// ==========================================
router.put("/:busNumber/status", async (req, res) => {
    try {
        const { status } = req.body;
        const normalizedBusNumber = normalizeBusNumber(req.params.busNumber);

        // Validate status
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Use 'active' or 'inactive'."
            });
        }

        // Find bus and its assigned route
        const bus = await Bus.findOne({ busNumber: normalizedBusNumber })
            .populate("route");

        if (!bus) {
            return res.status(404).json({
                message: `Bus not found: ${normalizedBusNumber}`
            });
        }

        // ------------------------------------------
        // START TRIP: Reset previous location
        // ------------------------------------------
        if (status === "active") {
            const route = bus.route;

            if (!route) {
                return res.status(400).json({
                    message: "Route is not assigned to this bus."
                });
            }

            const originLat = route.originLatitude;
            const originLng = route.originLongitude;

            if (
                typeof originLat !== "number" ||
                typeof originLng !== "number" ||
                !Number.isFinite(originLat) ||
                !Number.isFinite(originLng)
            ) {
                return res.status(400).json({
                    message: "Route origin coordinates are missing or invalid.",
                    originLatitude: originLat,
                    originLongitude: originLng
                });
            }

            const updatedLocation = await BusLocation.findOneAndUpdate(
                { busNumber: normalizedBusNumber },
                {
                    $set: {
                        busNumber: normalizedBusNumber,
                        latitude: originLat,
                        longitude: originLng,
                        routeStart: route.origin || "",
                        routeEnd: route.destination || "",
                        updatedAt: new Date()
                    }
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                    runValidators: true
                }
            );

            console.log("==================================");
            console.log("BUS LOCATION RESET SUCCESSFULLY");
            console.log("Bus Number:", updatedLocation.busNumber);
            console.log("Latitude:", updatedLocation.latitude);
            console.log("Longitude:", updatedLocation.longitude);
            console.log("Updated At:", updatedLocation.updatedAt);
            console.log("==================================");
        }

        bus.status = status;
        await bus.save();

        return res.status(200).json({
            message:
                status === "active"
                    ? "Trip started successfully. Bus location reset to route origin."
                    : "Trip ended successfully",
            bus
        });

    } catch (error) {
        console.error("Bus status update error:", error);

        return res.status(500).json({
            message: "Error updating bus status",
            error: error.message
        });
    }
});

module.exports = router;