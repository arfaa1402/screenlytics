// backend/routes/plannerRoutes.js

const express = require('express');
const router  = express.Router();
const {
  getTasks,
  addTask,
  toggleTask,
  deleteTask
} = require('../controllers/plannerController');
const authMiddleware = require('../middleware/authMiddleware');

// GET    /api/planner              → fetch all tasks for user
router.get('/',             authMiddleware, getTasks);

// POST   /api/planner              → add new task
router.post('/',            authMiddleware, addTask);

// PATCH  /api/planner/:id/toggle   → toggle done/undone
router.patch('/:id/toggle', authMiddleware, toggleTask);

// DELETE /api/planner/:id          → delete task
router.delete('/:id',       authMiddleware, deleteTask);

module.exports = router;
