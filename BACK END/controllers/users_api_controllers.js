const fs = require('fs');
const path = require('path');
const User = require('../models/user');

const readUsers = () => {
    try {
        return JSON.parse(
            fs.readFileSync(path.join(__dirname, '../database/users.json'), 'utf8')
        );
    } catch (error) {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(
        path.join(__dirname, '../database/users.json'),
        JSON.stringify(users, null, 2),
        'utf8'
    );
};

let users = readUsers();

const authUsersMiddleware = (req, res, next) => {
    const authHeader = req.headers['x-auth'];
    const userId = parseInt(req.params.id);

    if (!authHeader) {
        return res.status(401).send('Unauthorized');
    }

    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).send('Usuario no encontrado');
    }

    if (user.contraseña !== authHeader) {
        return res.status(401).send('Unauthorized');
    }

    next();
};

// POST /users (registrar usuario)
const registerUser = (req, res) => {
    try {
        const { name, email, password, confirm_password } = req.body;

        if (password !== confirm_password) {
            return res.status(400).send('Las contraseñas no son iguales');
        }

        const newUser = new User(name, email, password);

        users.push(newUser.toObject());

        writeUsers(users);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: newUser.toObject()
        });

    } catch (err) {
        res.status(400).send(err.message);
    }
};

// GET /users (admin)
const getUsers = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        if (authHeader !== 'admin_auth') {
            return res.status(401).send('Unauthorized');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedUsers = users.slice(startIndex, endIndex);
        const nextPage = endIndex < users.length ? page + 1 : null;

        res.json({
            page,
            next_page: nextPage,
            limit,
            total: users.length,
            data: paginatedUsers
        });

    } catch (err) {
        res.status(400).send(err.message);
    }
};

// GET /users/:id
const getUser = (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.json(user);

    } catch (err) {
        res.status(400).send(err.message);
    }
};

// PATCH /users/:id
const updateUser = (req, res) => {
    try {
        let users = readUsers();
        const userId = parseInt(req.params.id);
        const { name, email, password } = req.body;

        // Validar que se envíe al menos un campo
        if (!name && !email && !password) {
            return res.status(400).json({ error: 'Debe enviar al menos un campo para actualizar' });
        }

        // Buscar el usuario
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Actualizar campos sin validar contraseña
        if (name) users[userIndex].name = name;
        if (email) users[userIndex].email = email;
        if (password) users[userIndex].contraseña = password;

        // Guardar en el archivo
        writeUsers(users);

        // Devolver el usuario actualizado (sin contraseña)
        const { contraseña, ...userWithoutPassword } = users[userIndex];
        
        res.json({
            message: 'Usuario actualizado exitosamente',
            user: userWithoutPassword
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
    }
};

// DELETE /users/:id
const deleteUser = (req, res) => {
    try {
        const userId = parseInt(req.params.id);        
        
        let users = readUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        users.splice(userIndex, 1);
        writeUsers(users);
                
        res.json({ message: `Usuario ${userId} eliminado exitosamente` });

    } catch (err) {
        console.error('Error en deleteUser:', err);
        res.status(500).json({ error: err.message });
    }
};

const login = (req, res) => {
    let data = req.body;
    let user = users.find((user) => {
        return (user.email == data.email && user.contraseña == data.password);
    });
    
    if (user) {
        const { contraseña, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.sendStatus(401);
    }
};

const register = (req, res) => {
    try {
        const { name, email, password, confirm_password } = req.body;        
        
        if (password !== confirm_password) {
            return res.status(400).json({ error: "Las contraseñas no coinciden" });
        }
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }
        
        const users = readUsers();        
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            return res.status(400).json({ error: "El correo electrónico ya está registrado" });
        }
        
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        
        const newUser = {
            id: newId,
            name: name,
            email: email,
            contraseña: password
        };
        
        users.push(newUser);
        writeUsers(users);
        
        const { contraseña, ...userToReturn } = newUser;
        res.status(201).json(userToReturn);
        
    } catch (err) {
        console.error('Error en register:', err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

module.exports = {
    login,
    register,
    registerUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    authUsersMiddleware
};