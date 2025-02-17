const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/postbook');
const cookieParser = require('cookie-parser');
const bycrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');

// const fs = require('fs');
// const multer = require('multer');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index'); // Render the index.ejs file
});

app.get('/account', isLoggedIn, async (req , res)=>{
    let user = await userModel.findOne({email:req.user.email}).populate('posts');
    // console.log(user);
    res.render('account', {user});
})

app.get('/signup',(req,res)=>{
    res.render('signup');
});
app.get('/login', (req , res)=>{
    res.render('login');
})
app.post('/signup', async (req , res)=>{
    let{ name,phone,email, password,pincode} = req.body;
    let user = await userModel.findOne({email});
    if(user){
        return res.status(500).send('User already exists');
    }
    bycrypt.genSalt(10, (err, salt)=>{
        bycrypt.hash(password, salt, async (err, hash)=>{
            if(err){
                return res.status(500).send('Error in hashing');
            }
            let user = await userModel.create({
                name,
                phone,
                email,
                password: hash,
                pincode
            });
            
            let token=jwt.sign({email:email,userid:user._id},"shailen");
            res.cookie('jwt', token);
            res.render('/login')
        })
    })
})

app.post('/login', async (req , res)=>{
    let{email, password} = req.body;
    let user = await userModel.findOne({email});
    if(!user){
        return res.status(500).send('Somthing went wrong');
    }
    bycrypt.compare(password, user.password, (err, result)=>{
        if(result){
            let token=jwt.sign({email:email,userid:user._id},"shailen");
            res.cookie('token', token);
            res.status(200).redirect('/account');
        }else{
           res.send("Somthing went wrong")
        }
    })

});
app.get('/logout', (req , res)=>{
   res.cookie("token","");
   res.redirect('/login');
})

function isLoggedIn(req, res, next) {
const token = req.cookies.token; // Ensure correct cookie name

if (!token) { 
    return res.redirect('/login'); // Redirect if token is missing
}

try {
    let data = jwt.verify(token, "shailen"); 
    req.user = data;
    next();
} catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.redirect('/login'); // Redirect if JWT is invalid
}
}


app.get('/addbook',(req,res)=>{
    res.render('addbook');
});
app.get('/booksbrowse',(req,res)=>{
    res.render('bookstore');
});

const PORT = process.env.PORT || 3000;
app.listen(3000, () => console.log(`Server running on http://localhost:${3000}`));