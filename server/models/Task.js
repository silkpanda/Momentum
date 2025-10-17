const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  // --- NEW FIELD ---
  // Add a field for the point value of a task.
  // Default to a standard value, e.g., 10 points.
  points: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('task', TaskSchema);

module.exports = {
    Task
};