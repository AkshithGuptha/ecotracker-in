import express from "express";
import axios from "axios";
import CarbonEntry from "../models/CarbonEntry.js";
import User from "../models/user.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// POST /api/carbon/calculate
router.post("/calculate", authMiddleware, async (req, res) => {
  try {
    const { activityType, details } = req.body;

    const activityMap = {
      car: "passenger_vehicle-vehicle_type_car-fuel_source_na-distance_na-engine_size_na",
      bike: "passenger_vehicle-vehicle_type_motorbike-fuel_source_na-distance_na-engine_size_na",
      flight: "passenger_flight-route_type_domestic-aircraft_type_na-distance_na-class_na",
      bus: "passenger_vehicle-vehicle_type_bus-fuel_source_na-distance_na-engine_size_na",
      train: "passenger_train-route_type_na-fuel_source_na-distance_na",
    };

    if (!activityMap[activityType]) {
      return res.status(400).json({ error: "Invalid activityType" });
    }

    // Call Climatiq API
    const response = await axios.post(
      "https://api.climatiq.io/estimate",
      {
        emission_factor: { id: activityMap[activityType] },
        parameters: {
          distance: details.distance || 1,
          distance_unit: "km",
          passengers: details.passengers || 1,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CLIMATIQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const co2 = response.data.co2e || 0;

    // Save entry in CarbonEntry
    const entry = await CarbonEntry.create({
      userId: req.user.id,
      activityType,
      details,
      co2,
      date: new Date(),
    });

    // Award points
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 10 } });

    res.json({ entry, co2, pointsAwarded: 10 });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/carbon/stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Daily stats
    const dailyEntries = await CarbonEntry.find({
      userId,
      date: { $gte: today },
    });

    // Weekly stats
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const weeklyEntries = await CarbonEntry.find({
      userId,
      date: { $gte: weekAgo },
    });

    // Prepare graph data
    const stats = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo);
      d.setDate(weekAgo.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEntries = weeklyEntries.filter(
        (e) => e.date.toISOString().slice(0, 10) === dateStr
      );
      const co2 = dayEntries.reduce((sum, e) => sum + e.co2, 0);
      stats.push({ date: dateStr, co2 });
    }

    res.json({ daily: dailyEntries, weekly: stats });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
