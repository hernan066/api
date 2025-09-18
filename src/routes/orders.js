const express = require('express');
const router = express.Router();

// Placeholder orders
router.post('/', (req, res) => {
  res.json({ message: 'Crear orden' });
});

module.exports = router;
