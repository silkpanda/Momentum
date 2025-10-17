const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// --- DIAGNOSTIC LOGGING MIDDLEWARE ---
// This will log every incoming request to the console.
app.use((req, res, next) => {
  console.log(`[Request Received] Method: ${req.method}, URL: ${req.originalUrl}`);
  next(); // Pass the request to the next handler
});

// Standard Middleware
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