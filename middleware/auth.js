import jwt from "jsonwebtoken";
import User from "../models/user.js";
import NGO from "../models/ngo.js";

// Middleware: verify token + fetch user or ngo
export default async function auth(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a user token
    if (decoded.user && decoded.user.id) {
      const user = await User.findById(decoded.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      req.user = user;
    } 
    // Check if it's an NGO token
    else if (decoded.ngo && decoded.ngo.id) {
      const ngo = await NGO.findById(decoded.ngo.id);
      if (!ngo) return res.status(404).json({ message: "NGO not found" });
      req.ngo = ngo;
    } 
    // Invalid token payload
    else {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token is not valid" });
  }
}
