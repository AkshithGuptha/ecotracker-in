import express from "express";
import Location from "../models/Location.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// List all locations
router.get("/", async (req,res)=>{
  const locations = await Location.find();
  res.json(locations);
});

// Add new location
router.post("/", auth, async (req,res)=>{
  const { name, coordinates, description, type } = req.body;
  const location = new Location({ name, coordinates, description, type });
  await location.save();
  res.json(location);
});

export default router;
