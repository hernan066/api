const express = require("express");
const { checkJwt } = require("../middlewares/checkJwt");
const router = express.Router();

// Placeholder ruta auth
router.get("/publica", (req, res) => {
  res.json({ msg: "Esta ruta es pública" });
});
router.get("/privada", checkJwt, (req, res) => {
  res.json({
    msg: "Esta ruta es protegida",
    user: req.auth, // payload del JWT
  });
});

module.exports = router;
