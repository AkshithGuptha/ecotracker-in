import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  description: { type: String, default: "" },
  type: { type: String, enum: ["pickup", "dropoff", "donation"], required: true },
});

export default mongoose.model("Location", locationSchema);
