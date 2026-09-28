import mongoose from "mongoose";

const carbonEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  activityType: {
    type: String,
    enum: ["car", "bike", "bus", "train", "flight"],
    required: true,
  },
  details: {
    type: Object, // can store distance, passengers, or other activity-specific info
    default: {},
  },
  co2: {
    type: Number,
    default: 0, // CO2e emitted for this activity
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("CarbonEntry", carbonEntrySchema);
