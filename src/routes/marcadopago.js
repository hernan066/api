// routes/mp.js
const express = require("express");
const axios = require("axios");
const Seller = require("../models/Seller"); // tu modelo
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();
//auth.mercadopago.com.ar/authorization?client_id=3660043673802742&response_type=code&platform_id=mp&redirect_uri=https%3A%2F%2F5dhwhnnr-3040.brs.devtunnels.ms%2Fapi%2Fmp%2Fcallback&state=google-oauth2%7C109037933989739551967
/**
 * 1) Redirigir al vendedor a MercadoPago para autorizar
 *    state => aquí usamos userId de Auth0 para identificar al vendedor en el callback
 */
https: router.get("/connect/:userId", (req, res) => {
  const { userId } = req.params;
  const redirectUri = process.env.MP_REDIRECT_URI; // debe coincidir con la app en MP
  const clientId = process.env.MP_CLIENT_ID;

  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${encodeURIComponent(
    clientId
  )}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${encodeURIComponent(userId)}`;

  return res.redirect(authUrl);
});

/**
 * 2) Callback: MercadoPago devuelve ?code=...&state=...
 *    Aquí hacemos el intercambio por access_token (en el backend)
 */
router.get("/callback", async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code) {
    return res.status(400).send("Falta el code");
  }

  try {
    // 1. Intercambiar code por access_token
    const tokenRes = await axios.post(
      "https://api.mercadopago.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        code,
        redirect_uri: process.env.MP_REDIRECT_URI,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const { access_token, refresh_token, user_id, expires_in } = tokenRes.data;

    const expiresAt = Date.now() + expires_in * 1000; // lo pasamos a timestamp en ms

    // 2. Guardar rol de Usuario como 'seller'
    const res = await User.updateOne(
      { auth0Id: userId }, // el mismo que mandaste en state
      {
        role: "seller",
      }
    );
    console.log(res);

    const res1 = await Seller.updateOne(
      { userId }, // el mismo que mandaste en state
      {
        userId,
        role: "seller",
        mpAccessToken: access_token,
        mpRefreshToken: refresh_token,
        mpUserId: user_id?.toString(),
        expires_at: expiresAt,
        status: "active",
      },
      { upsert: true } // crea si no existe
    );
    console.log(res1);
    console.log("✅ Tokens guardados en DB para usuario:", userId);

    // 3. Redirigir al frontend
    res.redirect(`${process.env.CLIENT_URL}?mp=connected`);
  } catch (error) {
    console.error(
      "❌ Error en callback MP:",
      error.response?.data || error.message
    );
    res.redirect(`${process.env.CLIENT_URL}/dashboard?mp=error`);
  }
});

/**
 * 3) (Opcional) Endpoint para refrescar token usando refresh_token
 */
router.post("/refresh/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const seller = await Seller.findOne({ userId });
    if (!seller || !seller.mpRefreshToken)
      return res.status(404).json({ message: "No refresh token" });

    const resp = await axios.post(
      "https://api.mercadopago.com/oauth/token",
      {
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: seller.mpRefreshToken,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = resp.data;
    seller.mpAccessToken = data.access_token;
    seller.mpRefreshToken = data.refresh_token || seller.mpRefreshToken;
    seller.mpExpiresIn = data.expires_in || seller.mpExpiresIn;
    await seller.save();

    return res.json({ ok: true, seller });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
