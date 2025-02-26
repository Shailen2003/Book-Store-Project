const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to user
    id: { type: String, required: true }, // Book ID (Unique per user)
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true }
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
