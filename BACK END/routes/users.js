const express = require('express');
const routerUsers = express.Router();

const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    authUsersMiddleware
} = require('../controllers/users_api_controllers.js');

// GET /users (obtener todos los usuarios - requiere autenticación admin)
routerUsers.get('/', getUsers);

// GET /users/:id (obtener usuario por ID)
routerUsers.get('/:id', getUser);

// PATCH /users/:id (actualizar usuario)
routerUsers.patch('/:id', updateUser);

// DELETE /users/:id (eliminar usuario)
routerUsers.delete('/:id', deleteUser);

module.exports = routerUsers;