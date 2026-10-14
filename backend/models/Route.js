const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: true,
        unique: true
    },

    origin: {
        type: String,
        required: true
    },

    originLatitude: {
        type: Number,
        required: true
    },

    originLongitude: {
        type: Number,
        required: true
    },

    destination: {
        type: String,
        required: true
    },

    destinationLatitude: {
        type: Number,
        required: true
    },

    destinationLongitude: {
        type: Number,
        required: true
    }
});

const Route = mongoose.model("Route", routeSchema);

module.exports = Route;