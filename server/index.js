const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Diagnostic Logging Middleware
app.use((req, res, next) => {
  console.log(`[AXIOM_LOG] Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Standard Middleware
app.use(cors());
app.use(express.json());

// API Routes
try {
  console.log('[AXIOM_LOG] Mounting /api/tasks route...');
  app.use('/api/tasks', require('./routes/tasks'));
  console.log('[AXIOM_LOG] SUCCESS: /api/tasks mounted.');

  console.log('[AXIOM_LOG] Mounting /api/users route...');
  app.use('/api/users', require('./routes/users'));
  console.log('[AXIOM_LOG] SUCCESS: /api/users mounted.');

  console.log('[AXIOM_LOG] Mounting /api/family route...');
  app.use('/api/family', require('./routes/family'));
  console.log('[AXIOM_LOG] SUCCESS: /api/family mounted.');

  app.use('/api/rewards', require('./routes/rewards'));
  
  console.log('[AXIOM_LOG] All routes mounted successfully.');
} catch (err) {
  console.error('[AXIOM_FATAL] Server crash during route mounting:', err);
  process.exit(1); // Exit if routes fail to mount
}

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('API is ready and listening for requests.');
    });
  } catch (err) {
    console.error('[AXIOM_FATAL] Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();