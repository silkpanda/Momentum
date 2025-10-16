const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected successfully.');
  } catch (err) {
    console.error('MongoDB connection ERROR:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;