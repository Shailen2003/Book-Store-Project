const { name } = require('ejs');
const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/bookexchange");

const userSchema = new mongoose.Schema({
    name: String,
    phone: Number,
    email: String,
    password: String,
    pincode:Number,
    posts:[{type:mongoose.Schema.Types.ObjectId, ref:'postbook'}]
});

module.exports = mongoose.model('user', userSchema);