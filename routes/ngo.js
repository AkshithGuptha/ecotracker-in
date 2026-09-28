import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import NGO from "../models/ngo.js";
import Product from "../models/Product.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// NGO Register
router.post("/register", async (req, res) => {
  try {
    const { organizationName, email, password, contactPerson, phone, address, city, state, pincode, registrationNumber } = req.body;

    let ngo = await NGO.findOne({ email });
    if (ngo) return res.status(400).json({ message: "NGO already registered with this email" });

    const hashed = await bcrypt.hash(password, 10);
    ngo = new NGO({
      organizationName,
      email,
      password: hashed,
      contactPerson,
      phone,
      address,
      city,
      state,
      pincode,
      registrationNumber
    });
    
    await ngo.save();

    const payload = { ngo: { id: ngo._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({ 
      token, 
      ngo: {
        id: ngo._id,
        organizationName: ngo.organizationName,
        email: ngo.email
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// NGO Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let ngo = await NGO.findOne({ email });
    if (!ngo) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, ngo.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const payload = { ngo: { id: ngo._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ 
      token, 
      ngo: {
        id: ngo._id,
        organizationName: ngo.organizationName,
        email: ngo.email
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add Product (Protected route)
router.post("/products", auth, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.ngo.id);
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    const { name, description, price, link, pointsRequired, quantity, category, imageUrl, condition, productLink, isAvailable } = req.body;

    const newProduct = new Product({
      name,
      description,
      price,
      link: link || productLink || '',
      pointsRequired,
      quantity,
      category,
      imageUrl,
      ngoId: req.ngo.id,
      ngoName: ngo.organizationName,
      isActive: isAvailable !== false
    });

    const savedProduct = await newProduct.save();
    res.json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get NGO Products (Protected - only NGO can see their own products)
router.get("/products", auth, async (req, res) => {
  try {
    const products = await Product.find({ ngoId: req.ngo.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Product (Protected)
router.put("/products/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ngoId: req.ngo.id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, price, link, pointsRequired, quantity, category, imageUrl, condition, productLink, isAvailable } = req.body;

    product.name = name;
    product.description = description;
    product.price = price;
    product.link = link || productLink || '';
    product.pointsRequired = pointsRequired;
    product.quantity = quantity;
    product.category = category;
    product.imageUrl = imageUrl;
    product.isActive = isAvailable !== false;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Product (Protected)
router.delete("/products/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, ngoId: req.ngo.id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get NGO Profile (Protected)
router.get("/profile", auth, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.ngo.id).select('-password');
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    res.json(ngo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
