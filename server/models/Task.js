const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'family',
    required: true
  },
  userId: { // User who CREATED the task
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  // --- NEW: Assigned user ---
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: false // Tasks can be unassigned in the inbox
  },
  name: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 10
  },
  dueDate: {
    type: Date,
    required: false 
  },
  // --- NEW: Task Status ---
  status: {
    type: String,
    enum: ['incomplete', 'pending_approval', 'complete'],
    default: 'incomplete'
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