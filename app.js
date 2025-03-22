const express = require("express");
const app = express();
const session = require("express-session");
const mongoose = require("mongoose");
const userModel = require("./models/user");
const postModel = require("./models/postbook");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
// const cartFile = path.join(__dirname, "cart.json");
const Cart = require("./models/cartModel");
const multer = require("multer");
const upload = multer(); // Initialize multer to handle form data

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
// Session setup
app.use(
  session({
    secret: "shailen", // Change this to a more secure secret in production
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true, // Secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use((req, res, next) => {
  // If the user is logged in, make their profile available in all views
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
});

app.get("/", (req, res) => {
  res.render("index"); // Render the index.ejs file
});

// ✅ Route to view account & cart details
app.get("/account", isLoggedIn, async (req, res) => {
  try {
    console.log("Fetching Account Data for:", req.user);
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("posts")
      .populate("cart") // 🛠️ Ensure cart is populated
      .lean();

    if (!user) {
      return res.redirect("/login");
    }

    // ✅ **Use `req.user._id` instead of `req.user.id`**
    
    const cartItems = await Cart.find({ user: userId }).lean();
    console.log("Cart Items Fetched:", cartItems);

    const totalItems = cartItems.length;
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );

    res.render("account", {
      user: user,
      cartItems: cartItems,
      totalItems: totalItems,
      totalPrice: totalPrice.toFixed(2),
    });
  } catch (error) {
    console.error("Error fetching account data:", error.message);
    res.status(500).send("Server Error");
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/addbook", isLoggedIn, upload.none(), async (req, res) => {
  // console.log("Session User:", req.session.user);
  // console.log("Request User:", req.user);

  const {
    title,
    bookPurpose,
    bookType,
    bookCondition,
    quantity,
    price,
    shippingCharges,
    sellerName,
    sellerEmail,
    sellerAddress,
    sellerPhone,
  } = req.body;

  const userId = req.user ? req.user.userId : null; // Ensure user is logged in

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    // Create new book post
    const newBook = new postModel({
      seller: userId, // ✅ Make sure seller ID is correct
      title,
      bookPurpose,
      bookType,
      bookCondition: bookType === "used" ? bookCondition : undefined,
      quantity: Number(quantity),
      price: Number(price),
      shippingCharges: Number(shippingCharges) || 0,
      sellerDetails: {
        name: sellerName,
        email: sellerEmail,
        address: sellerAddress,
        phone: sellerPhone,
      },
    });

    await newBook.save();

    // Associate book with user
    await userModel.findByIdAndUpdate(userId, {
      $push: { posts: newBook._id },
    });

    // console.log("Book added successfully:", newBook);

    res.redirect("/account"); // Redirect to account page
  } catch (error) {
    console.error("Error saving book:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/signup", async (req, res) => {
  const { name, phone, email, password, pincode } = req.body;

  try {
    // Check if user already exists
    let existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // Generate salt and hash password
    bcrypt.genSalt(10, (saltErr, salt) => {
      if (saltErr) {
        return res.status(500).send("Error in generating salt");
      }

      bcrypt.hash(password, salt, async (hashErr, hash) => {
        if (hashErr) {
          return res.status(500).send("Error in hashing password");
        }

        // Create new user with hashed password
        let newUser = await userModel.create({
          name,
          phone,
          email,
          password: hash,
          pincode,
        });
        // Generate JWT token
        const token = jwt.sign(
          { email: email, userId: newUser._id },
          "shailen",
          { expiresIn: "1h" }
        );

        // Send token as a cookie
        res.cookie("token", token, { httpOnly: true, secure: false }); // set secure: true in production with https
        res.send("User registered successfully");
      });
    });
  } catch (error) {
    console.error("Error in user registration:", error.message);
    res.status(500).send("Server error");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).send("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }

    // Generate JWT Token
    const token = jwt.sign(
      { email: user.email, userId: user._id.toString() },
      "shailen",
      { expiresIn: "1h" }
    );

    // Set Token in Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Change to `true` if using HTTPS
      sameSite: "lax", // Helps prevent CSRF issues
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    // ✅ **Ensure _id is stored properly in session**
    req.session.user = {
      _id: user._id.toString(), // Ensure `_id` is a string for MongoDB queries
      name: user.name,
      email: user.email,
      phone: user.phone,
      pincode: user.pincode,
    };

    console.log("Session User Set:", req.session.user);

    res.redirect("/account");
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/logout", (req, res) => {
  res.cookie("token", "", { expires: new Date(0) }); // Properly clear the cookie
  req.session.destroy(); // Destroy session
  res.redirect("/login");
});

app.get("/about", (req, res) => {
  res.render("about");
});
function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies.token;
    console.log("Token Received:", token);

    if (token) {
      let data = jwt.verify(token, "shailen");
      console.log("JWT Verified Data:", data);
      req.user = data;
      req.session.user = req.session.user || {
        _id: data.userId,
        email: data.email,
      };
    } else if (req.session.user) {
      console.log("Session User Found:", req.session.user);
      req.user = req.session.user;
    } else {
      console.log("No token or session. Redirecting to login.");
      return res.redirect("/login");
    }

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.redirect("/login");
  }
}
app.get("/addbook", (req, res) => {
  res.render("addbook");
});
app.get("/booksbrowse", (req, res) => {
  res.render("bookstore");
});
// Route to view the car
app.get("/cart", isLoggedIn, async (req, res) => {
  try {
    console.log("Fetching cart for user:", req.user._id);

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const cartItems = await Cart.find({ user: userId }).lean();



    console.log("Cart Items Fetched:", cartItems);

    res.render("account", {
        user: req.user,  // 🛠️ Ensure user is passed
        cartItems: cartItems,
        totalItems: cartItems.length,
        totalPrice: cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)
    });
    
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Route to add an item to the cart (Structured like addbook)
app.post("/add-to-cart", isLoggedIn, upload.none(), async (req, res) => {
  const { bookId, name, price, image } = req.body;
  console.log("Received Data:", req.body);

  const userId = new mongoose.Types.ObjectId(req.user.userId);

  if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
  }

  if (!bookId) {
      return res.status(400).json({ error: "Book ID is required" });
  }

  try {
      // ✅ **Check if the book is already in the user's cart**
      const existingCartItem = await Cart.findOne({ user: userId, id: bookId });

      if (existingCartItem) {
          return res.status(400).json({ error: "Book is already in your cart" });
      }

      // ✅ **If book is not in cart, then add it**
      const newCartItem = new Cart({
          user: userId,
          id: bookId,  
          name,
          price: Number(price),
          image,
      });

      await newCartItem.save();

      await userModel.findByIdAndUpdate(userId, { $push: { cart: newCartItem._id } }, { new: true });

      console.log("✅ Item added to cart:", newCartItem);

      res.redirect("/account");
  } catch (error) {
      console.error("❌ Error adding to cart:", error);
      res.status(500).json({ error: error.message });
  }
});


// Route to remove an item from the cart
// app.get("/delete-item/:id", isLoggedIn, async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const itemId = parseInt(req.params.id);

//     await Cart.findOneAndDelete({ user: userId, id: itemId });
//     res.redirect("/account");
//   } catch (error) {
//     console.error("Error deleting item:", error.message);
//     res.status(500).send("Server Error");
//   }
// });



// Route to clear the entire cart
app.get("/remove-item/:id", isLoggedIn, async (req, res) => {
  try {
    const itemId = req.params.id; // Get item ID from URL
    console.log("Deleting item:", itemId);

    // Find and delete the cart item
    const deletedItem = await Cart.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return res.status(404).send("Item not found");
    }

    console.log("Deleted item:", deletedItem);

    res.redirect("/account"); // Redirect to account page after deleting
  } catch (error) {
    console.error("Error deleting cart item:", error.message);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(3000, () =>
  console.log(`Server running on http://localhost:${3000}`)
);
