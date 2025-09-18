// models/Seller.js
const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // viene de Auth0
  storeName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String },
  mpAccessToken: { type: String }, // lo vamos a llenar con OAuth de MercadoPago
  mpRefreshToken: { type: String }, // lo vamos a llenar con OAuth de MercadoPago
  mpUserId: { type: String }, // lo vamos a llenar con OAuth de MercadoPago
  status: { type: String, default: "pending" }, // pending | active
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Seller", SellerSchema);
