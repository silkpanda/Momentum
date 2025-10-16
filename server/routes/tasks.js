const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { getTestUser } = require('../models/User');

// @route   GET api/tasks
// @desc    Get all tasks for the test user
// @access  Public
router.get('/', async (req, res) => {
  try {
    const userId = await getTestUser();
    const tasks = await Task.find({ userId: userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/tasks
// @desc    Create a task
// @access  Public
router.post('/', async (req, res) => {
  try {
    const userId = await getTestUser();
    const newTask = new Task({
      userId: userId,
      name: req.body.name,
    });
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    await task.deleteOne(); // Using deleteOne() instead of remove()
    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Task not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;