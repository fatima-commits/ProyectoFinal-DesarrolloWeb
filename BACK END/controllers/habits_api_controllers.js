const fs = require('fs');
const path = require('path');
const { Habit, HabitException, habits } = require('../models/habit');

// Leer usuarios dinámicamente
function getUsers() {
    try {
        return JSON.parse(
            fs.readFileSync(path.join(__dirname, '../database/users.json'), 'utf-8')
        );
    } catch (error) {
        return [];
    }
}

exports.registerHabit = function(req, res) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const users = getUsers();
    let user = users.find(u => u.contraseña === auth);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const { title, trigger, days, color, icon, status } = req.body;

    // Validaciones
    if (!title) return res.status(400).json({ error: "El título es obligatorio" });
    if (!trigger) return res.status(400).json({ error: "El disparador (trigger) es obligatorio" });
    if (!days || !Array.isArray(days) || days.length === 0) {
        return res.status(400).json({ error: "Debe seleccionar al menos un día" });
    }
    if (!color) return res.status(400).json({ error: "El color es obligatorio" });
    if (!icon) return res.status(400).json({ error: "El icono es obligatorio" });

    let newHabit;
    try {
        newHabit = new Habit(title, trigger, days, color, icon, user.id, status || 'active');
    } catch (error) {
        return res.status(400).json({ error: error.errorMessage });
    }

    habits.push(newHabit.toObj());
    fs.writeFileSync(
        path.join(__dirname, '../database/habits.json'),
        JSON.stringify(habits, null, 2),
        'utf-8'
    );

    res.status(201).json({
        message: "¡Hábito creado exitosamente!",
        habit: newHabit.toObj()
    });
};

exports.authUserMiddleware = function(req, res, next) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const users = getUsers();
    let user = users.find(u => u.contraseña === auth);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    req.user = user;
    next();
};

exports.authHabitsMiddleware = function(req, res, next) {
    const auth = req.headers['x-auth'];
    const id_habit = req.params.id;

    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    let habit = habits.find(h => h.id === Number(id_habit));
    if (!habit) return res.status(404).json({ error: "Hábito no encontrado" });

    const users = getUsers();
    let user = users.find(u => u.id === habit.id_user);
    if (auth !== user.contraseña) return res.status(401).json({ error: "Contraseña incorrecta" });

    req.habit = habit;
    next();
};

exports.showAllHabits = function(req, res) {
    let userHabits = habits.filter(habit => habit.id_user === req.user.id);

    // Filtrar por estado
    if (req.query.status) {
        userHabits = userHabits.filter(habit => habit.status === req.query.status);
    }

    // Filtrar por color
    if (req.query.color) {
        userHabits = userHabits.filter(habit => habit.color === req.query.color);
    }

    // Filtrar por día
    if (req.query.day) {
        const day = Number(req.query.day);
        userHabits = userHabits.filter(habit => habit.days.includes(day));
    }

    // Paginación
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const total = userHabits.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const data = userHabits.slice(startIndex, endIndex);
    const next_page = endIndex < total ? page + 1 : null;

    res.status(200).json({ 
        page, 
        next_page, 
        limit, 
        total, 
        data 
    });
};

exports.getHabit = function(req, res) {
    res.status(200).json(req.habit);
};

exports.updateHabit = function(req, res) {
    const { title, trigger, days, color, icon, status } = req.body;

    // Validar que al menos un campo sea enviado
    if (!title && !trigger && !days && !color && !icon && !status) {
        return res.status(400).json({ 
            error: "Debes enviar al menos un campo para actualizar" 
        });
    }

    let habit = req.habit;
    const habitIndex = habits.findIndex(h => h.id === habit.id);

    try {
        if (title) habits[habitIndex].title = title;
        if (trigger) habits[habitIndex].trigger = trigger;
        if (days) habits[habitIndex].days = days;
        if (color) habits[habitIndex].color = color;
        if (icon) habits[habitIndex].icon = icon;
        if (status) habits[habitIndex].status = status;
    } catch (error) {
        return res.status(400).json({ error: error.errorMessage });
    }

    fs.writeFileSync(
        path.join(__dirname, '../database/habits.json'),
        JSON.stringify(habits, null, 2),
        'utf-8'
    );

    res.status(200).json({ 
        message: "¡Hábito actualizado correctamente!",
        habit: habits[habitIndex]
    });
};

exports.deleteHabit = function(req, res) {
    let habit = req.habit;
    const index = habits.findIndex(h => h.id === habit.id);
    
    if (index !== -1) {
        habits.splice(index, 1);
    }

    fs.writeFileSync(
        path.join(__dirname, '../database/habits.json'),
        JSON.stringify(habits, null, 2),
        'utf-8'
    );

    res.status(200).json({ 
        message: `¡Hábito ${habit.id} eliminado correctamente!`,
        habit 
    });
};