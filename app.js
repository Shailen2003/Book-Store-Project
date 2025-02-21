const express = require('express');
const app = express();
const session = require('express-session');
const mongoose = require('mongoose');
const userModel = require('./models/user');
const postModel = require('./models/postbook');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require("fs");
const cartFile = path.join(__dirname, "cart.json");
const multer = require('multer');
const upload = multer(); // Initialize multer to handle form data


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
// Session setup
app.use(session({
    secret: 'your-secret-key', // Change this to a more secure secret in production
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, // Secure cookies in production
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
}));
app.use((req, res, next) => {
    // If the user is logged in, make their profile available in all views
    if (req.session.user) {
        res.locals.user = req.session.user;
    }
    next();
});

app.get('/', (req, res) => {
    res.render('index'); // Render the index.ejs file
});

app.get('/account', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email })
            .populate('posts')  // ✅ Ensure books are fetched
            .lean();

        if (!user) {
            console.log("User not found. Redirecting to login.");
            return res.redirect('/login'); 
        }

        console.log("User Data:", user); // ✅ Debugging
        res.render('account', { user });

    } catch (error) {
        console.error("Error fetching user:", error.message);
        res.status(500).send("Server Error");
    }
});




app.get('/signup', (req, res) => {
    res.render('signup');
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/addbook', isLoggedIn, upload.none(), async (req, res) => {
    // console.log("Session User:", req.session.user);
    // console.log("Request User:", req.user);

    const {
        title, bookPurpose, bookType, bookCondition,
        quantity, price, shippingCharges,
        sellerName, sellerEmail, sellerAddress, sellerPhone
    } = req.body;

    const userId = req.user ? req.user.userId : null; // Ensure user is logged in

    if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
    }

    try {
        // Create new book post
        const newBook = new postModel({
            seller: userId,  // ✅ Make sure seller ID is correct
            title, bookPurpose, bookType,
            bookCondition: bookType === 'used' ? bookCondition : undefined,
            quantity: Number(quantity),
            price: Number(price),
            shippingCharges: Number(shippingCharges) || 0,
            sellerDetails: { name: sellerName, email: sellerEmail, address: sellerAddress, phone: sellerPhone }
        });

        await newBook.save();

        // Associate book with user
        await userModel.findByIdAndUpdate(userId, { $push: { posts: newBook._id } });

        // console.log("Book added successfully:", newBook);

        res.redirect('/account'); // Redirect to account page

    } catch (error) {
        console.error("Error saving book:", error);
        res.status(500).json({ error: error.message });
    }
});




app.post('/signup', async (req, res) => {
    const { name, phone, email, password, pincode } = req.body;

    try {
        // Check if user already exists
        let existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Generate salt and hash password
        bcrypt.genSalt(10, (saltErr, salt) => {
            if (saltErr) {
                return res.status(500).send('Error in generating salt');
            }

            bcrypt.hash(password, salt, async (hashErr, hash) => {
                if (hashErr) {
                    return res.status(500).send('Error in hashing password');
                }

                // Create new user with hashed password
                let newUser = await userModel.create({
                    name,
                    phone,
                    email,
                    password: hash,
                    pincode
                });
                // Generate JWT token
                const token = jwt.sign({ email: email, userId: newUser._id }, 'shailen', { expiresIn: '1h' });

                // Send token as a cookie
                res.cookie('token', token, { httpOnly: true, secure: false }); // set secure: true in production with https
                res.send('User registered successfully');
            });
        });
    } catch (error) {
        console.error("Error in user registration:", error.message);
        res.status(500).send('Server error');
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).send('User not found');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // JWT Token Generate
        const token = jwt.sign({ email: user.email, userId: user._id }, 'shailen', { expiresIn: '1h' });

        // Cookie में Token Set करें
        res.cookie('token', token, { httpOnly: true, secure: false });

        // ✅ **Session में User की Information Set करें**
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            pincode: user.pincode
        };

        console.log("Session User Set:", req.session.user);

        res.redirect('/account');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server Error');
    }
});



app.get('/logout', (req, res) => {
    res.cookie("token", "", { expires: new Date(0) }); // Properly clear the cookie
    req.session.destroy(); // Destroy session
    res.redirect('/login');
});


app.get('/about', (req, res) => {
    res.render('about');
})
function isLoggedIn(req, res, next) {
    try {
        const token = req.cookies.token; // Ensure correct cookie name

        if (!token) {
            console.log("No token found. Redirecting to login.");
            return res.redirect('/login'); // Redirect if token is missing
        }

        let data = jwt.verify(token, "shailen");
        // console.log("JWT Verified Data:", data);
        req.user = data;
        req.session.user = req.session.user || { id: data.userId, email: data.email };  // Ensure session is initialized
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.redirect('/login'); // Redirect if JWT is invalid
    }
}




app.get('/addbook', (req, res) => {
    res.render('addbook');
});
app.get('/booksbrowse', (req, res) => {
    res.render('bookstore');
});
// Temporary in-memory cart storage
let cart = [];

// Route to add items to the cart
app.post('/add-to-cart', (req, res) => {
    const { name, price, image } = req.body;
    
    // Generate a unique ID for each cart item
    const itemId = cart.length + 1;
    
    // Push the item to the cart array
    cart.push({ id: itemId, name, price, image });
    
    // Redirect to cart page
    res.redirect('/cart');
});

// Route to view the cart
app.get('/cart', (req, res) => {
    const totalItems = cart.length;
    const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    res.render('cart', {
        cartItems: cart,
        totalItems: totalItems,
        totalPrice: totalPrice
    });
});

// Route to remove an item from the cart
app.get('/delete-item/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    cart = cart.filter(item => item.id !== itemId);
    res.redirect('/cart');
});

// Route to clear the entire cart
app.get('/clear-cart', (req, res) => {
    cart = []; // Empty the cart
    res.redirect('/cart');
});

const PORT = process.env.PORT || 3000;
app.listen(3000, () => console.log(`Server running on http://localhost:${3000}`));