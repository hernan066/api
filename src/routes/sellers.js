// routes/sellers.js
const express = require("express");
const Seller = require("../models/Seller");
const router = express.Router();

// Crear un vendedor
router.post("/", async (req, res) => {
  try {
    const { userId, storeName, address, phone } = req.body;

    const existing = await Seller.findOne({ userId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Ya existe un vendedor con este usuario" });
    }

    const seller = new Seller({ userId, storeName, address, phone });
    await seller.save();

    res.status(201).json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener vendedor por usuario (Auth0 userId)
router.get("/me/:userId", async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.params.userId });
    if (!seller) {
      return res.status(404).json({ message: "No se encontró el vendedor" });
    }
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
