const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    id: { type: String, required: true }, // ✅ Remove `unique: true`
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true }
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
