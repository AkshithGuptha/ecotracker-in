import jwt from "jsonwebtoken";
import User from "../models/user.js";
import NGO from "../models/ngo.js";

export default async function auth(req, res, next) {
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({ message: "Server authentication is not configured" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (decoded?.user?.id) {
      const user = await User.findById(decoded.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      req.user = user;
    } else if (decoded?.ngo?.id) {
      const ngo = await NGO.findById(decoded.ngo.id);
      if (!ngo) return res.status(404).json({ message: "NGO not found" });
      req.ngo = ngo;
    } else {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Token is not valid" });
  }
}
