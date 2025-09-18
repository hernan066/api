// Generador de claves idempotentes
const { v4: uuidv4 } = require('uuid');

function generateKey() {
  return uuidv4();
}

module.exports = { generateKey };
