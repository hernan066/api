// routes/products.js
const express = require("express");
const Product = require("../models/Product");
const Seller = require("../models/Seller");
const router = express.Router();

// Crear un producto
router.post("/", async (req, res) => {
  try {
    const { userId, name, price, stock } = req.body;

    // buscamos el vendedor
    const seller = await Seller.findOne({ userId });
    if (!seller) {
      return res
        .status(400)
        .json({ message: "El usuario no está registrado como vendedor" });
    }

    const product = new Product({
      name,
      price,
      stock,
      sellerId: seller._id,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar productos de un vendedor
router.get("/seller/:userId", async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.params.userId });
    if (!seller) {
      return res.status(404).json({ message: "Vendedor no encontrado" });
    }

    const products = await Product.find({ sellerId: seller._id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
