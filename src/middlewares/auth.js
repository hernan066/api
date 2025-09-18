// middleware/auth.js
const axios = require("axios");
const User = require("../models/User");

async function attachUser(req, res, next) {
  try {
    const { sub, email: tokenEmail, name: tokenName } = req.auth.payload;

    let user = await User.findOne({ auth0Id: sub });

    if (!user) {
      let email = tokenEmail;
      let name = tokenName;

      // Si no vino email o name en el token → pedimos a /userinfo
      if (!email || !name) {
        const accessToken = req.headers.authorization.split(" ")[1];

        const { data: userinfo } = await axios.get(
          `${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log(userinfo);

        email = email || userinfo.email;
        name = name || userinfo.name;
      }

      // Crear el usuario en Mongo
      user = await User.create({
        auth0Id: sub,
        email,
        name,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Error attaching user:", err.message);
    res.status(500).json({ error: "Error attaching user" });
  }
}

module.exports = { attachUser };
