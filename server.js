const express = require('express');
const connectDB = require('./db');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// connect database
connectDB();

// init midleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API running'));

// define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/users'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`listening to port ${PORT} `));
