const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();


// =====================================================
// HELPER - NORMALIZE BUS NUMBER
// =====================================================

const normalizeBusNumber = (busNumber) => {
  if (!busNumber) return null;

  let number = busNumber.trim().toUpperCase();

  // If already BUS-001 format
  if (number.startsWith("BUS-")) {
    const numericPart = number.replace("BUS-", "");

    if (/^\d+$/.test(numericPart)) {
      return `BUS-${numericPart.padStart(3, "0")}`;
    }

    return number;
  }

  // If user enters 01 / 1 / 001
  if (/^\d+$/.test(number)) {
    return `BUS-${number.padStart(3, "0")}`;
  }

  return number;
};


// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      role
    } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingEmail = await User.findOne({
      email: normalizedEmail
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    const existingPhone = await User.findOne({
      phone: phone.trim()
    });

    if (existingPhone) {
      return res.status(409).json({
        message: "Phone number is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "student"
    });

    res.status(201).json({
      message: "Registration successful",

      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        busNumber: user.busNumber
      }
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const {
      name,
      email,
      busNumber,
      password,
      role
    } = req.body;


    // =================================================
    // STUDENT LOGIN
    // =================================================

    if (role === "student") {

      if (!name || !email || !password) {
        return res.status(400).json({
          message:
            "Name, email and password are required"
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const user = await User.findOne({
        name: name.trim(),
        email: normalizedEmail,
        role: "student"
      });

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid student name or email"
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid password"
        });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d"
        }
      );

      return res.status(200).json({
        message: "Login successful",

        token,

        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          busNumber: user.busNumber
        }
      });
    }


    // =================================================
    // DRIVER LOGIN
    // =================================================

    if (role === "driver") {

      if (!name || !busNumber || !password) {
        return res.status(400).json({
          message:
            "Driver name, bus number and password are required"
        });
      }

      // Convert 01 → BUS-001
      const normalizedBusNumber =
        normalizeBusNumber(busNumber);

      const user = await User.findOne({
        name: name.trim(),
        busNumber: normalizedBusNumber,
        role: "driver"
      });

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid driver name or bus number"
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid password"
        });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d"
        }
      );

      return res.status(200).json({
        message: "Login successful",

        token,

        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,

          // Always return BUS-001 format
          busNumber: normalizeBusNumber(
            user.busNumber
          )
        }
      });
    }


    // =================================================
    // INVALID ROLE
    // =================================================

    return res.status(400).json({
      message:
        "Please select a valid role"
    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
});


// =====================================================
// CREATE DRIVER
// =====================================================

router.post("/create-driver", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      busNumber
    } = req.body;

    if (
      !name ||
      !phone ||
      !email ||
      !password ||
      !busNumber
    ) {
      return res.status(400).json({
        message:
          "Name, phone, email, password and bus number are required"
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    // Convert 01 → BUS-001
    const normalizedBusNumber =
      normalizeBusNumber(busNumber);

    // Check email
    const existingEmail = await User.findOne({
      email: normalizedEmail
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    // Check phone
    const existingPhone = await User.findOne({
      phone: phone.trim()
    });

    if (existingPhone) {
      return res.status(409).json({
        message: "Phone number is already registered"
      });
    }

    // Check bus number
    const existingBus = await User.findOne({
      busNumber: normalizedBusNumber,
      role: "driver"
    });

    if (existingBus) {
      return res.status(409).json({
        message:
          "This bus number is already assigned to a driver"
      });
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Create driver
    const driver = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "driver",
      busNumber: normalizedBusNumber
    });

    res.status(201).json({
      message: "Driver created successfully",

      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        role: driver.role,
        busNumber: driver.busNumber
      }
    });

  } catch (error) {
    console.error(
      "Create driver error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;