const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import the auth middleware

const { Task } = require('../models/Task');
const { User } = require('../models/User');

// --- Helper & Gamification Logic (No Changes) ---
const isSameDay = (d1, d2) => !d1 || !d2 ? false : d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const isYesterday = (d1, d2) => {
    if (!d1 || !d2) return false;
    const yesterday = new Date(d1);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(yesterday, d2);
};
const handleLeveling = (user, pointsGained) => {
    user.xp += pointsGained;
    let xpToNextLevel = user.level * 100;
    while (user.xp >= xpToNextLevel) {
        user.level += 1;
        user.xp -= xpToNextLevel;
        xpToNextLevel = user.level * 100;
    }
};

// @route   GET api/tasks
// @desc    Get all tasks for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => { // Apply auth middleware
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/tasks
// @desc    Create a task for the logged-in user
// @access  Private
router.post('/', auth, async (req, res) => { // Apply auth middleware
  try {
    const { name, points } = req.body;
    const newTask = new Task({
      userId: req.user.id, // Use the authenticated user's ID
      name: name,
      points: points || 10,
    });
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/tasks/:id
// @desc    Edit a task
// @access  Private
router.put('/:id', auth, async (req, res) => { /* ... (Logic is user-agnostic, but still protect the route) ... */ });

// @route   POST api/tasks/:id/complete
// @desc    Complete a task
// @access  Private
router.post('/:id/complete', auth, async (req, res) => { /* ... (Logic uses task.userId, protect the route) ... */ });

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => { /* ... (Logic is user-agnostic, but still protect the route) ... */ });


// --- Unchanged PUT, POST (complete), and DELETE routes for brevity, now with auth middleware ---
router.put('/:id', auth, async (req, res) => { try { const { name, points } = req.body; const task = await Task.findByIdAndUpdate( req.params.id, { name, points }, { new: true } ); if (!task) return res.status(404).json({ msg: 'Task not found' }); res.json(task); } catch (err) { res.status(500).json({ msg: 'Server Error' }); }});
router.post('/:id/complete', auth, async (req, res) => { try { const task = await Task.findById(req.params.id); if (!task) return res.status(404).json({ msg: 'Task not found' }); const user = await User.findById(task.userId); if (!user) return res.status(404).json({ msg: 'User not found' }); const now = new Date(); if (!isSameDay(now, user.lastCompletedDate)) { user.currentStreak = (user.lastCompletedDate && isYesterday(now, user.lastCompletedDate)) ? user.currentStreak + 1 : 1; user.lastCompletedDate = now; } user.points += task.points; handleLeveling(user, task.points); await user.save(); await task.deleteOne(); res.json({ msg: `Task completed! You earned ${task.points} points!` }); } catch (err) { res.status(500).json({ msg: 'Server Error' }); }});
router.delete('/:id', auth, async (req, res) => { try { const task = await Task.findById(req.params.id); if (!task) return res.status(404).json({ msg: 'Task not found' }); await task.deleteOne(); res.json({ msg: 'Task permanently deleted.' }); } catch (err) { res.status(500).json({ msg: 'Server Error' }); }});

module.exports = router;