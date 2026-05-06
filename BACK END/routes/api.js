const express = require('express');
const path = require('path');
const routerApi = express.Router();

const usersController = require('../controllers/users_api_controllers.js');
const usersRoutes = require('./users.js');
const habitsRoutes = require('./habits.js');
const journalsRoutes = require('./journals.js');
const moodsRoutes = require('./moods.js');

// RUTAS DE PÁGINAS
routerApi.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/login.html'));
});

routerApi.get('/home.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/home.html'));
});

routerApi.get('/login.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/login.html'));
});

routerApi.get('/habits.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/habits.html'));
});

routerApi.get('/journal.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/journal.html'));
});

routerApi.get('/mood.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/mood.html'));
});

routerApi.get('/mentalHealth.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/mentalHealth.html'));
});

routerApi.get('/settings.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/settings.html'));
});

// RUTAS DE AUTENTICACIÓN
routerApi.post('/login', usersController.login);
routerApi.post('/register', usersController.register);

// RUTAS
routerApi.use('/users', usersRoutes);
routerApi.use('/habits', habitsRoutes);
routerApi.use('/journals', journalsRoutes);
routerApi.use('/moods', moodsRoutes);

// RUTA 404
routerApi.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada: ' + req.method + ' ' + req.path });
});

module.exports = routerApi;