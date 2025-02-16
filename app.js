const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs'); // Set EJS as the view engine
// app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(__dirname + "/views"));

app.get('/', (req, res) => {
    res.render('index'); // Render the index.ejs file
});

const PORT = process.env.PORT || 3000;
app.listen(3000, () => console.log(`Server running on http://localhost:${3000}`));