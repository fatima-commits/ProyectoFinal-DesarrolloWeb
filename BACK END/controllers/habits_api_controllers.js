const fs = require('fs');
const path = require('path');
const Habit = require('../models/habit');

let habits = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/habits.json'), 'utf8')
);

const findUserByPassword = (password) => {
    const freshUsers = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../database/users.json'), 'utf8')
    );
    return freshUsers.find(u => u.contraseña === password);
};

// POST /habits
const createHabit = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        const { after, going_to, days = [], color, icon } = req.body;

        if (!authHeader) {
            return res.status(401).send('Unauthorized');
        }

        const user = findUserByPassword(authHeader);

        if (!user) {
            return res.status(401).send('Contraseña incorrecta');
        }

        const newHabit = new Habit(after, going_to, days, color, icon, user.id);
        habits.push(newHabit.toObject());

        fs.writeFileSync(
            path.join(__dirname, '../database/habits.json'),
            JSON.stringify(habits, null, 2),
            'utf8'
        );

        res.status(201).json({
            message: 'Hábito creado exitosamente',
            habit: newHabit.toObject()
        });

    } catch (err) {
        res.status(400).send(err.message);
    }
};

// GET /habits
const getHabits = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        if (!authHeader) return res.status(401).send('Unauthorized');
        
        const user = findUserByPassword(authHeader);
        if (!user) return res.status(401).send('Usuario no encontrado');
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const colorFilter = req.query.color;
        const dayFilter = req.query.day;
        const activeFilter = req.query.active !== undefined ? req.query.active === 'true' : null;
        
        let userHabits = habits.filter(h => h.id_user === user.id);
        
        // Aplicar filtro de color
        if (colorFilter) {
            userHabits = userHabits.filter(h => h.color === colorFilter);
        }
        
        // Aplicar filtro de día (búsqueda en el array de días)
        if (dayFilter) {
            userHabits = userHabits.filter(h => h.days.includes(dayFilter));
        }
        
        // Aplicar filtro de activo
        if (activeFilter !== null) {
            userHabits = userHabits.filter(h => h.active === activeFilter);
        }
        
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginated = userHabits.slice(startIndex, endIndex);
        const totalPages = Math.ceil(userHabits.length / limit);
        
        res.json({
            page,
            next_page: endIndex < userHabits.length ? page + 1 : null,
            limit,
            total: userHabits.length,
            total_pages: totalPages,
            data: paginated
        });
        
    } catch (err) {
        res.status(400).send(err.message);
    }
};

// GET /habits/:id
const getHabit = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        const habitId = parseInt(req.params.id);

        if (!authHeader) {
            return res.status(401).send('Unauthorized');
        }

        const user = findUserByPassword(authHeader);
        if (!user) return res.status(401).send('Contraseña incorrecta');

        const habit = habits.find(h => h.id === habitId);

        if (!habit) {
            return res.status(404).send('Hábito no encontrado');
        }

        if (habit.id_user !== user.id) {
            return res.status(401).send('No tienes permiso para ver este hábito');
        }

        res.json(habit);

    } catch (err) {
        res.status(400).send(err.message);
    }
};

// PATCH /habits/:id
const updateHabit = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        const habitId = parseInt(req.params.id);
        const { after, going_to, days, color, icon, active } = req.body;

        if (!authHeader) {
            return res.status(401).send('Unauthorized');
        }

        const user = findUserByPassword(authHeader);
        if (!user) return res.status(401).send('Contraseña incorrecta');

        const habitIndex = habits.findIndex(h => h.id === habitId);

        if (habitIndex === -1) {
            return res.status(404).send('Hábito no encontrado');
        }

        if (habits[habitIndex].id_user !== user.id) {
            return res.status(401).send('No tienes permiso para editar este hábito');
        }

        if (after) habits[habitIndex].after = after;
        if (going_to) habits[habitIndex].going_to = going_to;
        if (days) habits[habitIndex].days = days;
        if (color) habits[habitIndex].color = color;
        if (icon) habits[habitIndex].icon = icon;
        if (active !== undefined) habits[habitIndex].active = active;

        fs.writeFileSync(
            path.join(__dirname, '../database/habits.json'),
            JSON.stringify(habits, null, 2),
            'utf8'
        );

        res.json({
            message: 'Hábito actualizado',
            habit: habits[habitIndex]
        });

    } catch (err) {
        res.status(400).send(err.message);
    }
};

// DELETE /habits/:id
const deleteHabit = (req, res) => {
    try {
        const authHeader = req.headers['x-auth'];
        const habitId = parseInt(req.params.id);

        if (!authHeader) {
            return res.status(401).send('Unauthorized');
        }

        const user = findUserByPassword(authHeader);
        if (!user) return res.status(401).send('Contraseña incorrecta');

        const habitIndex = habits.findIndex(h => h.id === habitId);

        if (habitIndex === -1) {
            return res.status(404).send('Hábito no encontrado');
        }

        if (habits[habitIndex].id_user !== user.id) {
            return res.status(401).send('No tienes permiso para eliminar este hábito');
        }

        const deletedHabit = habits[habitIndex];
        habits.splice(habitIndex, 1);

        fs.writeFileSync(
            path.join(__dirname, '../database/habits.json'),
            JSON.stringify(habits, null, 2),
            'utf8'
        );

        res.json({
            message: `Hábito con id ${habitId} eliminado`,
            habit: deletedHabit
        });

    } catch (err) {
        res.status(400).send(err.message);
    }
};

module.exports = {
    createHabit,
    getHabits,
    getHabit,
    updateHabit,
    deleteHabit
};