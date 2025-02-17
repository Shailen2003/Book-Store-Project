const { name } = require('ejs');
const mongoose = require('mongoose');

const bookPostSchema = new mongoose.Schema({
   seller: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
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
   isbn: {
       type: String,
       required: false
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
   photos: [{
       type: String
   }],
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
   paymentMode: {
       type: String,
       enum: ['upi', 'bank'],
       required: true
   },
   sellerDetails: {
       name: { type: String, required: true },
       email: { type: String, required: true },
       address: { type: String, required: true },
       phone: { type: String, required: true }
   },
   date: {
       type: Date,
       default: Date.now
   },
   likes: [{
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User'
   }]
});

module.exports = mongoose.model('postbook', bookPostSchema);
