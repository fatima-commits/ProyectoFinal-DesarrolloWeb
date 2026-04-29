const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const usersRoutes = require('./users.js');
//const tasksRoutes = require('./tasks.js');
//const tagsRoutes = require('./tags.js');
const usersController = require('../controllers/users_api_controllers.js');
const routerApi = express.Router();

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

routerApi.use('/users', usersRoutes);
//routerApi.use('/tasks', tasksRoutes);
//routerApi.use('/tags', tagsRoutes);

routerApi.post('/login', usersController.login);
routerApi.post('/register', usersController.register);

module.exports = routerApi;