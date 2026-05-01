const express = require('express');
const routerMoods = express.Router();
const moodsController = require('../controllers/moods_api_controllers');

// ==========================================
// RUTAS
// ==========================================

// POST /moods - Crear nuevo mood (requiere autenticación)
routerMoods.post(
    '/',
    moodsController.authUserMiddleware,
    moodsController.createMood
);

// GET /moods - Obtener todos los moods del usuario (requiere autenticación)
routerMoods.get(
    '/',
    moodsController.authUserMiddleware,
    moodsController.getAllMoods
);

// GET /moods/week - Obtener moods de la semana
routerMoods.get(
    '/week/data',
    moodsController.authUserMiddleware,
    moodsController.getWeeklyMoods
);

// GET /moods/today - Obtener mood de hoy
routerMoods.get(
    '/today/data',
    moodsController.authUserMiddleware,
    moodsController.getTodayMood
);

// GET /moods/:id - Obtener un mood específico
routerMoods.get(
    '/:id',
    moodsController.authMoodsMiddleware,
    moodsController.getMood
);

// PATCH /moods/:id - Actualizar un mood
routerMoods.patch(
    '/:id',
    moodsController.authMoodsMiddleware,
    moodsController.updateMood
);

// DELETE /moods/:id - Eliminar un mood
routerMoods.delete(
    '/:id',
    moodsController.authMoodsMiddleware,
    moodsController.deleteMood
);

module.exports = routerMoods;