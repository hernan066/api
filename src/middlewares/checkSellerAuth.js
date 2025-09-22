// src/middleware/checkMPAuth.js
const axios = require("axios");
const Seller = require("../models/Seller"); // tu modelo ajustado

async function refreshAccessToken(refreshToken) {
  try {
    const res = await axios.post("https://api.mercadopago.com/oauth/token", {
      client_secret: process.env.MP_CLIENT_SECRET,
      client_id: process.env.MP_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    return res.data; // { access_token, refresh_token, expires_in, user_id, ... }
  } catch (error) {
    console.error(
      "❌ Error refrescando token MP:",
      error.response?.data || error.message
    );
    return null;
  }
}

module.exports = async function checkMPAuth(req, res, next) {
  try {
    const userId = req.auth?.payload?.sub; // ID de Auth0
    if (!userId) {
      return res
        .status(401)
        .json({ error: "No autorizado - usuario no encontrado" });
    }

    const seller = await Seller.findOne({ userId });
    if (!seller || !seller.mpAccessToken) {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard/reconnect-mp`);
    }

    const { mpAccessToken, mpRefreshToken, expires_at } = seller;

    // Token aún válido
    if (Date.now() < expires_at) {
      req.mercadoPago = {
        access_token: mpAccessToken,
        mpUserId: seller.mpUserId,
      };
      return next();
    }

    // Token vencido → intento de refresh
    const newTokens = await refreshAccessToken(mpRefreshToken);

    if (!newTokens) {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard/reconnect-mp`);
    }

    // Guardar en DB nuevos valores
    seller.mpAccessToken = newTokens.access_token;
    seller.mpRefreshToken = newTokens.refresh_token;
    seller.mpUserId = newTokens.user_id?.toString() || seller.mpUserId;
    seller.expires_at = Date.now() + newTokens.expires_in * 1000;
    seller.status = "active";
    await seller.save();

    req.mercadoPago = {
      access_token: seller.mpAccessToken,
      mpUserId: seller.mpUserId,
    };
    return next();
  } catch (err) {
    console.error("❌ Error en middleware checkMPAuth:", err);
    return res.redirect(`${process.env.CLIENT_URL}/dashboard/reconnect-mp`);
  }
};
