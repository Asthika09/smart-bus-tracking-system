const mongoose = require("mongoose");

const busLocationSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true,
        index: true,
        trim: true
    },

    latitude: {
        type: Number,
        required: true
    },

    longitude: {
        type: Number,
        required: true
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },

    routeStart: {
        type: String,
        default: ""
    },

    routeEnd: {
        type: String,
        default: ""
    }
});

const BusLocation = mongoose.model("BusLocation", busLocationSchema);

module.exports = BusLocation;