const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "inactive"
    }
});

const Driver = mongoose.model("Driver", driverSchema);

module.exports = Driver;