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
        // Fetch user along with their book posts
        let user = await userModel.findOne({ email: req.user.email }).lean();

        if (!user) {
            console.log("User not found. Redirecting to login.");
            return res.redirect('/login'); // Redirect if user not found
        }

        // Fetch the user's book posts separately
        const posts = await postModel.find({ seller: user._id }).lean();

        // Pass user data along with posts
        res.render('account', { user: { ...user, posts } });

    } catch (error) {
        console.error("Error fetching user:", error.message);
        res.status(500).send("Server Error"); // Handle unexpected errors
    }
});


app.get('/signup', (req, res) => {
    res.render('signup');
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/addbook', upload.none(), async (req, res) => {
    console.log("Received Data:", req.body);
    const {
        seller, // Should be user ID from session/auth
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
        sellerPhone
    } = req.body;

    // If using authentication, get the actual seller ID
    const userId = req.user ? req.user._id : new mongoose.Types.ObjectId(); // Generate valid ObjectId if missing

    // Check required fields
    if (!title || !bookPurpose || !bookType || !quantity || !price || !sellerName || !sellerEmail || !sellerAddress || !sellerPhone) {
        return res.status(400).json({ error: "All required fields must be provided." });
    }

    try {
        // Structure the data correctly
        const newBook = new postModel({
            seller: userId, // Now a valid ObjectId
            title,
            bookPurpose,
            bookType,
            bookCondition: bookType === 'used' ? bookCondition : undefined, // Only include if 'used'
            quantity: Number(quantity),
            price: Number(price),
            shippingCharges: Number(shippingCharges) || 0,
            sellerDetails: {
                name: sellerName,
                email: sellerEmail,
                address: sellerAddress,
                phone: sellerPhone
            }
        });

        console.log("Formatted Book Data:", newBook);

        await newBook.save();
        res.status(201).json(newBook);
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
                res.cookie('jwt', token, { httpOnly: true, secure: false }); // set secure: true in production with https
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
        // Find the user in the database
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).send('User not found');
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // Store user data in session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            pincode: user.pincode
        };

        // Redirect to the account page or homepage
        res.redirect('/account');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/logout', (req , res)=>{
    res.cookie("token","");
    res.redirect('/login');
 })

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

        let data = jwt.verify(token, process.env.JWT_SECRET || "shailen");
        req.user = data;

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