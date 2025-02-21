const { name } = require('ejs');
const mongoose = require('mongoose');

const bookPostSchema = new mongoose.Schema({
   seller: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'user',
       required: true
   },
   title: {
       type: String,
       required: true
   },
   bookPurpose: {
       type: String,
       enum: ['sell', 'exchange', 'both'],
       required: true
   },
   bookType: {
       type: String,
       enum: ['new', 'used'],
       required: true
   },
   bookCondition: {
       type: String,
       enum: ['excellent', 'good', 'fair'],
       required: function() { return this.bookType === 'used'; }
   },
   quantity: {
       type: Number,
       required: true,
       min: 1
   },
   price: {
       type: Number,
       required: true
   },
   shippingCharges: {
       type: Number,
       default: 0
   },
   freeShipping: {
       type: Boolean,
       default: false
   },
   sellerDetails: {
       name: { type: String, required: true },
       email: { type: String, required: true },
       address: { type: String, required: true },
       phone: { type: String, required: true }
   }
});

module.exports = mongoose.model('postbook', bookPostSchema);
