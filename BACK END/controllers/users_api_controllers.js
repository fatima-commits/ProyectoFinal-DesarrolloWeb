const fs = require('fs');
const path = require('path');

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

const authUsersMiddleware = (req, res, next) => {
    const authHeader = req.headers['x-auth'];
    const userId = parseInt(req.params.id);

    if (!authHeader) {
        return res.status(401).send('Unauthorized');
    }

    let users = readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).send('Usuario no encontrado');
    }

    if (user.contraseña !== authHeader) {
        return res.status(401).send('Unauthorized');
    }

    next();
};

// POST /login - Login con acceso a la base de datos
const login = (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que se envíen email y contraseña
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Leer usuarios de la base de datos
        const users = readUsers();

        // Buscar el usuario por email y contraseña
        const user = users.find(u => u.email === email && u.contraseña === password);

        if (!user) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        // Devolver usuario sin la contraseña
        const { contraseña, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);

    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /register - Registrar nuevo usuario
const register = (req, res) => {
    try {
        const { name, email, password, confirm_password } = req.body;

        // Validaciones
        if (!name || !email || !password || !confirm_password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        // Leer usuarios
        const users = readUsers();

        // Verificar si el email ya existe
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Generar nuevo ID
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

        // Crear nuevo usuario
        const newUser = {
            id: newId,
            name: name,
            email: email,
            contraseña: password,
            joined_at: new Date().toISOString()
        };

        // Agregar a la lista y guardar
        users.push(newUser);
        writeUsers(users);

        // Devolver usuario sin contraseña
        const { contraseña, ...userToReturn } = newUser;
        res.status(201).json(userToReturn);

    } catch (err) {
        console.error('Error en register:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// GET /users (admin)
const getUsers = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        if (authHeader !== 'admin_auth') {
            return res.status(401).send('Unauthorized');
        }

        const users = readUsers();
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
        const users = readUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        // No devolver contraseña
        const { contraseña, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);

    } catch (err) {
        res.status(400).send(err.message);
    }
};

// PATCH /users/:id
const updateUser = (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, password, weight, height } = req.body; // ← agrega weight y height

        if (!name && !email && !password && !weight && !height) {
            return res.status(400).json({ error: 'Debe enviar al menos un campo' });
        }

        let users = readUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (name && name.trim() !== '')       users[userIndex].name       = name;
        if (email && email.trim() !== '')     users[userIndex].email      = email;
        if (password && password.length >= 8) users[userIndex].contraseña = password;
        if (weight)                           users[userIndex].weight     = Number(weight);
        if (height)                           users[userIndex].height     = Number(height);

        writeUsers(users);

        const { contraseña, ...userWithoutPassword } = users[userIndex];

        res.json({
            message: 'Usuario actualizado exitosamente',
            user: userWithoutPassword
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
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

module.exports = {
    login,
    register,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    authUsersMiddleware
};