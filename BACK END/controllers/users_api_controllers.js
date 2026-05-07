const User = require('../models/user');

const authUsersMiddleware = async (req, res, next) => {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    if (user.contraseña !== auth) return res.status(401).json({ error: "No autorizado" });

    next();
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });

        const user = await User.findOne({ email, contraseña: password });
        if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

        const { contraseña, ...userToReturn } = user.toObject();
        res.status(200).json(userToReturn);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password, confirm_password } = req.body;

        if (!name || !email || !password || !confirm_password)
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });

        if (password !== confirm_password)
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });

        if (password.length < 8)
            return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return res.status(400).json({ error: 'Email inválido' });

        const newUser = await User.create({ name, email, contraseña: password });

        const { contraseña, ...userToReturn } = newUser.toObject();
        res.status(201).json(userToReturn);

    } catch (err) {
        if (err.code === 11000)
            return res.status(400).json({ error: 'El email ya está registrado' });
        res.status(400).json({ error: err.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const auth = req.headers['x-auth'];
        if (auth !== 'admin_auth') return res.status(401).json({ error: "No autorizado" });

        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const data = await User.find().select('-contraseña').skip(skip).limit(limit);
        const next_page = skip + limit < total ? page + 1 : null;

        res.json({ page, next_page, limit, total, data });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-contraseña');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, email, password, weight, height } = req.body;

        if (!name && !email && !password && !weight && !height)
            return res.status(400).json({ error: 'Debe enviar al menos un campo' });

        const updates = {};
        if (name && name.trim())       updates.name       = name;
        if (email && email.trim())     updates.email      = email;
        if (password && password.length >= 8) updates.contraseña = password;
        if (weight)                    updates.weight     = Number(weight);
        if (height)                    updates.height     = Number(height);

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-contraseña');

        if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ message: 'Usuario actualizado', user: updated });

    } catch (err) {
        if (err.code === 11000)
            return res.status(400).json({ error: 'El email ya está en uso' });
        res.status(400).json({ error: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
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