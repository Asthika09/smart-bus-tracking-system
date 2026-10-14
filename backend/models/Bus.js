const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true,
        unique: true
    },

    driverName: {
        type: String,
        required: true
    },

    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Route",
        required: true
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "inactive"
    }
});

const Bus = mongoose.model("Bus", busSchema);

module.exports = Bus;