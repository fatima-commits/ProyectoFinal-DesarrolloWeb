const express = require('express');
const path = require('path');
const routerApi = express.Router();

// CARGAR ROUTERS CON MANEJO DE ERRORES
let usersRoutes, habitsRoutes, usersController;

try {
    usersController = require('../controllers/users_api_controllers.js');
    console.log('✅ users_api_controllers.js cargado');
} catch (error) {
    console.error('❌ Error al cargar users_api_controllers.js:', error.message);
}

try {
    usersRoutes = require('./users.js');
    console.log('✅ users.js cargado');
} catch (error) {
    console.error('❌ Error al cargar users.js:', error.message);
}

try {
    habitsRoutes = require('./habits.js');
    console.log('✅ habits.js cargado');
} catch (error) {
    console.error('❌ Error al cargar habits.js:', error.message);
}

try {
    habitsRoutes = require('./journals.js');
    console.log('✅ journals.js cargado');
} catch (error) {
    console.error('❌ Error al cargar journals.js:', error.message);
}

try {
    habitsRoutes = require('./moods.js');
    console.log('✅ moods.js cargado');
} catch (error) {
    console.error('❌ Error al cargar moods.js:', error.message);
}

// RUTAS DE PÁGINAS
routerApi.get('/', (req, res) => {
    const authHeader = req.headers['x-auth'];
    if (authHeader) {
        return res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/home.html'));
    }
    return res.sendFile(path.resolve(__dirname, '../../FRONTEND/views/login.html'));
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

// RUTAS DE AUTENTICACIÓN
if (usersController) {
    if (usersController.login) {
        routerApi.post('/login', usersController.login);
    }
    if (usersController.register) {
        routerApi.post('/register', usersController.register);
    }
}

// RUTAS DE USUARIOS
if (usersRoutes) {
    routerApi.use('/users', usersRoutes);
}

// RUTAS DE HÁBITOS
if (habitsRoutes) {
    routerApi.use('/habits', habitsRoutes);
}

//RUTAS DE JOURNAL
const journalsRoutes = require('./journals.js');
routerApi.use('/journals', journalsRoutes);

// RUTAS 404
routerApi.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada: ' + req.method + ' ' + req.path });
});

module.exports = routerApi;