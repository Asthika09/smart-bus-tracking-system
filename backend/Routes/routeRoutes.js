const express = require("express");
const router = express.Router();

const Route = require("../models/Route");

// ==========================================
// ADD NEW ROUTE
// ==========================================

router.post("/", async (req, res) => {
    try {
        const {
            routeName,
            origin,
            originLatitude,
            originLongitude,
            destination,
            destinationLatitude,
            destinationLongitude
        } = req.body;

        const route = new Route({
            routeName,
            origin,
            originLatitude,
            originLongitude,
            destination,
            destinationLatitude,
            destinationLongitude
        });

        const savedRoute = await route.save();

        res.status(201).json({
            message: "Route added successfully",
            route: savedRoute
        });

    } catch (error) {
        res.status(500).json({
            message: "Error adding route",
            error: error.message
        });
    }
});

// ==========================================
// GET ALL ROUTES
// ==========================================

router.get("/", async (req, res) => {
    try {
        const routes = await Route.find();

        res.json(routes);

    } catch (error) {
        res.status(500).json({
            message: "Error getting routes",
            error: error.message
        });
    }
});

// ==========================================
// GET ROUTE BY ID
// ==========================================

router.get("/:id", async (req, res) => {
    try {
        const route = await Route.findById(
            req.params.id
        );

        if (!route) {
            return res.status(404).json({
                message: "Route not found"
            });
        }

        res.json(route);

    } catch (error) {
        res.status(500).json({
            message: "Error getting route",
            error: error.message
        });
    }
});

// ==========================================
// UPDATE ROUTE
// ==========================================

router.put("/:id", async (req, res) => {
    try {
        const {
            routeName,
            origin,
            originLatitude,
            originLongitude,
            destination,
            destinationLatitude,
            destinationLongitude
        } = req.body;

        const route = await Route.findByIdAndUpdate(
            req.params.id,
            {
                routeName,
                origin,
                originLatitude,
                originLongitude,
                destination,
                destinationLatitude,
                destinationLongitude
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!route) {
            return res.status(404).json({
                message: "Route not found"
            });
        }

        res.json({
            message: "Route updated successfully",
            route
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating route",
            error: error.message
        });
    }
});

module.exports = router;