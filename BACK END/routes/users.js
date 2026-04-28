const express = require('express');
const routerUsers = express.Router();
const usersController = require('../controllers/users_api_controllers.js');

const {
    login,
    registerUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    authUsersMiddleware
} = require('../controllers/users_api_controllers.js');

routerUsers.post('/login', login);
routerUsers.post('/', registerUser);
routerUsers.get('/', getUsers);
routerUsers.get('/:id', authUsersMiddleware, getUser);
routerUsers.patch('/:id', updateUser);
routerUsers.delete('/:id', deleteUser);

module.exports = routerUsers;