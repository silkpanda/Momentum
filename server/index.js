require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- DEFINE ROUTES ---
app.use('/api/tasks', require('./routes/tasks'));

app.get('/', (req, res) => {
  res.send('Momentum API server is running.');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});