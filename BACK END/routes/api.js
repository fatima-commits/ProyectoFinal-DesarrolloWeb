const express = require('express');
const path = require('path');
const usersRoutes = require('./users.js');
const usersController = require('../controllers/users_api_controllers.js');

const routerApi = express.Router();

// Rutas de página
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

// Rutas de autenticación (acceden directamente a la base de datos)
routerApi.post('/login', usersController.login);
routerApi.post('/register', usersController.register);

// Rutas de usuarios (CRUD)
routerApi.use('/users', usersRoutes);

module.exports = routerApi;