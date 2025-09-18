const express = require('express');
const router = express.Router();

// Webhook Mercado Pago
router.post('/', (req, res) => {
  console.log('Webhook recibido:', req.body);
  res.sendStatus(200);
});

module.exports = router;
