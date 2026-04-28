const express = require('express');
const router = express.Router();
const {
    createHabit,
    getHabits,
    getHabit,
    updateHabit,
    deleteHabit
} = require('../controllers/habitController');

// POST /api/habits - Crear un nuevo hábito
router.post('/', createHabit);

// GET /api/habits
router.get('/', getHabits);

// GET /api/habits/:id
router.get('/:id', getHabit);

// PATCH /api/habits/:id
router.patch('/:id', updateHabit);

// DELETE /api/habits/:id
router.delete('/:id', deleteHabit);

module.exports = router;