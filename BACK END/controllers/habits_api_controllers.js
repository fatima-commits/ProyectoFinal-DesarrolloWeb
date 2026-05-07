const Habit = require('../models/habit');
const User = require('../models/user');

exports.authUserMiddleware = async function(req, res, next) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const user = await User.findOne({ contraseña: auth });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    req.user = user;
    next();
};

exports.authHabitsMiddleware = async function(req, res, next) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ error: "Hábito no encontrado" });

    const user = await User.findOne({ contraseña: auth });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    if (habit.id_user.toString() !== user._id.toString())
        return res.status(401).json({ error: "No tienes permiso sobre este hábito" });

    req.habit = habit;
    next();
};

exports.registerHabit = async function(req, res) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const user = await User.findOne({ contraseña: auth });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const { title, trigger, days, color, icon, status } = req.body;

    if (!title) return res.status(400).json({ error: "El título es obligatorio" });
    if (!trigger) return res.status(400).json({ error: "El trigger es obligatorio" });
    if (!days || !Array.isArray(days) || days.length === 0)
        return res.status(400).json({ error: "Debe seleccionar al menos un día" });
    if (!color) return res.status(400).json({ error: "El color es obligatorio" });
    if (!icon) return res.status(400).json({ error: "El icono es obligatorio" });

    try {
        const newHabit = await Habit.create({
            title, trigger,
            days: [...new Set(days)].sort(),
            color, icon,
            status: status || 'active',
            id_user: user._id
        });

        res.status(201).json({ message: "¡Hábito creado!", habit: newHabit });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.showAllHabits = async function(req, res) {
    const filter = { id_user: req.user._id };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.color) filter.color = req.query.color;
    if (req.query.day) filter.days = { $in: [Number(req.query.day)] };

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const total = await Habit.countDocuments(filter);
    const data = await Habit.find(filter).skip(skip).limit(limit);
    const next_page = skip + limit < total ? page + 1 : null;

    res.status(200).json({ page, next_page, limit, total, data });
};

exports.getHabit = function(req, res) {
    res.status(200).json(req.habit);
};

exports.updateHabit = async function(req, res) {
    const { title, trigger, days, color, icon, status } = req.body;

    if (!title && !trigger && !days && !color && !icon && !status)
        return res.status(400).json({ error: "Debes enviar al menos un campo" });

    const updates = {};
    if (title) updates.title = title;
    if (trigger) updates.trigger = trigger;
    if (days) updates.days = [...new Set(days)].sort();
    if (color) updates.color = color;
    if (icon) updates.icon = icon;
    if (status) updates.status = status;

    try {
        const updatedHabit = await Habit.findByIdAndUpdate(
            req.habit._id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "¡Hábito actualizado!", habit: updatedHabit });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteHabit = async function(req, res) {
    await Habit.findByIdAndDelete(req.habit._id);
    res.status(200).json({ message: "¡Hábito eliminado!", habit: req.habit });
};