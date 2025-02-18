// const express = require("express");
// const router = express.Router();

// // Temporary Cart Data (Replace with DB Later)
// let cart = [];

// // Add to Cart Route
// router.post("/add", (req, res) => {
//     const { bookId, title, price } = req.body;
    
//     // Check if book already in cart
//     const existing = cart.find(item => item.bookId === bookId);
//     if (!existing) {
//         cart.push({ bookId, title, price });
//         res.json({ success: true, message: `${title} added to cart!`, cart });
//     } else {
//         res.json({ success: false, message: `${title} is already in the cart.` });
//     }
// });

// // Get Cart Items
// router.get("/", (req, res) => {
//     res.json(cart);
// });

// // Remove from Cart
// router.post("/remove", (req, res) => {
//     const { bookId } = req.body;
//     cart = cart.filter(item => item.bookId !== bookId);
//     res.json({ success: true, message: "Item removed from cart!", cart });
// });

// module.exports = router;
