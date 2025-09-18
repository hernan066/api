const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  mpPaymentId: String
});

module.exports = mongoose.model('Order', orderSchema);
