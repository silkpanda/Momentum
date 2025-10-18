const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const isParent = require('../middleware/isParent');
const { Task } = require('../models/Task');
const { User } = require('../models/User');

// --- Helper & Gamification Logic (No changes) ---
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
// @desc    Get all tasks for the logged-in user's FAMILY
// @access  Private (Auth)
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ familyId: req.user.familyId })
                            .sort({ status: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/tasks
// @desc    Create a task (Parent Only)
// @access  Private (Parent)
router.post('/', [auth, isParent], async (req, res) => {
  try {
    const { name, points, dueDate, assignedTo } = req.body;
    
    const newTask = new Task({
      familyId: req.user.familyId,
      userId: req.user.id, 
      assignedTo: assignedTo || null, 
      name: name,
      points: points || 10,
      dueDate: dueDate || null,
      status: 'incomplete'
    });
    
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/tasks/:id
// @desc    Edit a task (Parent Only)
// @access  Private (Parent)
router.put('/:id', [auth, isParent], async (req, res) => {
  try {
    const { name, points, dueDate, assignedTo, status } = req.body;
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, familyId: req.user.familyId },
      { name, points, dueDate, assignedTo, status }, 
      { new: true }
    );
    
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/tasks/:id/request-approval
// @desc    Submit a task for approval (Parent on behalf of Child)
// @access  Private (Auth)
router.put('/:id/request-approval', auth, async (req, res) => {
  try {
    const { childId } = req.body;
    if (!childId) {
      return res.status(400).json({ msg: 'Child ID is required' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      familyId: req.user.familyId, // Ensures Parent is in the same family
      assignedTo: childId          // Ensures task is assigned to the correct child
    });
    
    if (!task) return res.status(404).json({ msg: 'Task not found or not assigned to this user' });

    if (task.status !== 'incomplete') {
      return res.status(400).json({ msg: 'Task has already been submitted' });
    }

    task.status = 'pending_approval';
    await task.save();
    
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/tasks/:id/complete
// @desc    Approve a task and award points (Parent Only)
// @access  Private (Parent)
router.post('/:id/complete', [auth, isParent], async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    if (task.status === 'complete') {
        return res.status(400).json({ msg: 'Task is already complete' });
    }

    const assignedUserId = task.assignedTo;
    if (!assignedUserId) {
      return res.status(400).json({ msg: 'Task must be assigned to a user before completion' });
    }

    const userToReward = await User.findById(assignedUserId);
    if (!userToReward) return res.status(404).json({ msg: 'Assigned user not found' });

    const now = new Date();
    if (!isSameDay(now, userToReward.lastCompletedDate)) {
      userToReward.currentStreak = (userToReward.lastCompletedDate && isYesterday(now, userToReward.lastCompletedDate)) ? userToReward.currentStreak + 1 : 1;
      // --- CORRECTION: Removed extraneous '.' ---
      userToReward.lastCompletedDate = now;
    }
    userToReward.points += task.points;
    handleLeveling(userToReward, task.points);
    await userToReward.save();
    
    task.status = 'complete';
    await task.save(); 

    res.json({ msg: `Task approved! ${userToReward.name} earned ${task.points} points!` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task (Parent Only)
// @access  Private (Parent)
router.delete('/:id', [auth, isParent], async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    await task.deleteOne();
    res.json({ msg: 'Task permanently deleted.' });
  } catch (err) { 
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/tasks/:id
// @desc    Get a single task by its ID
// @access  Private (Auth)
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      familyId: req.user.familyId
    });

    if (!task) {
      // --- CORRECTION: Changed 44 to 404 ---
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    res.json(task);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
       return res.status(404).json({ msg: 'Task not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;