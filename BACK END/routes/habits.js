const express = require('express');
const routerHabits = express.Router();

// Importar controlador - NOMBRE EXACTO
const habitsController = require('../controllers/../controllers/habits_api_controllers');

// POST /habits - Crear nuevo hábito (requiere autenticación)
routerHabits.post(
    '/',
    habitsController.authUserMiddleware,
    habitsController.registerHabit
);

// GET /habits - Obtener todos los hábitos del usuario (requiere autenticación)
routerHabits.get(
    '/',
    habitsController.authUserMiddleware,
    habitsController.showAllHabits
);

// GET /habits/:id - Obtener un hábito específico
routerHabits.get(
    '/:id',
    habitsController.authHabitsMiddleware,
    habitsController.getHabit
);

// PATCH /habits/:id - Actualizar un hábito
routerHabits.patch(
    '/:id',
    habitsController.authHabitsMiddleware,
    habitsController.updateHabit
);

// DELETE /habits/:id - Eliminar un hábito
routerHabits.delete(
    '/:id',
    habitsController.authHabitsMiddleware,
    habitsController.deleteHabit
);

module.exports = routerHabits;