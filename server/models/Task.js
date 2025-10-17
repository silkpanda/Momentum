const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  // --- MODIFICATION: Add familyId for scoping ---
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'family',
    required: true
  },
  // 'userId' is now 'createdBy'
  userId: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('task', TaskSchema);

module.exports = {
    Task
};