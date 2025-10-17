const dotenv = require('dotenv');
dotenv.config(); // Must be the first line

const express = require('express');
const connectDB = require('./db');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('API is ready and listening for requests.');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();