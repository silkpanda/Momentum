const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'family',
    required: true
  },
  userId: { // User who created the task
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 10
  },
  // --- NEW: Add Due Date ---
  dueDate: {
    type: Date,
    required: false // Optional field
  },
  // --- END NEW ---
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('task', TaskSchema);

module.exports = {
    Task
};