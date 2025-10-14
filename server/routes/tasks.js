const express = require('express');
const router = express.Router();

// Import our Task and User models
const Task = require('../models/Task');
const User = require('../models/User');

// A placeholder for our test user's ID
let testUserId;

// Helper function to get or create a test user
const getTestUser = async () => {
  if (testUserId) return testUserId;

  let user = await User.findOne();
  if (!user) {
    user = new User({ points: 0, streak: 0 });
    await user.save();
    console.log('Created a new test user.');
  }
  testUserId = user._id;
  return testUserId;
};

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the test user
 */
router.get('/', async (req, res) => {
  try {
    const userId = await getTestUser();
    const tasks = await Task.find({ userId: userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const userId = await getTestUser();
    const newTask = new Task({
      text: req.body.text,
      userId: userId,
    });
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task by its ID
 */
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        
        await task.deleteOne();

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;