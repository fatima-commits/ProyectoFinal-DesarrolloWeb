const fs = require('fs');
const path = require('path');
const { Mood, MoodException, moods } = require('../models/mood');

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

// ==========================================
// FUNCIONES DE CREACIÓN
// ==========================================

exports.createMood = function(req, res) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const users = getUsers();
    let user = users.find(u => u.contraseña === auth);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const { moodValue, date } = req.body;

    // Validaciones
    if (moodValue === undefined || moodValue === null) {
        return res.status(400).json({ error: "El valor de mood es obligatorio" });
    }

    let newMood;
    try {
        newMood = new Mood(moodValue, user.id, date || new Date());
    } catch (error) {
        return res.status(400).json({ error: error.errorMessage });
    }

    moods.push(newMood.toObj());
    fs.writeFileSync(
        path.join(__dirname, '../database/moods.json'),
        JSON.stringify(moods, null, 2),
        'utf-8'
    );

    res.status(201).json({
        message: "¡Mood registrado exitosamente!",
        mood: newMood.toObj()
    });
};

// ==========================================
// FUNCIONES DE LECTURA
// ==========================================

exports.authUserMiddleware = function(req, res, next) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const users = getUsers();
    let user = users.find(u => u.contraseña === auth);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    req.user = user;
    next();
};

exports.authMoodsMiddleware = function(req, res, next) {
    const auth = req.headers['x-auth'];
    const id_mood = req.params.id;

    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    let mood = moods.find(m => m.id === Number(id_mood));
    if (!mood) return res.status(404).json({ error: "Mood no encontrado" });

    const users = getUsers();
    let user = users.find(u => u.id === mood.id_user);
    if (auth !== user.contraseña) return res.status(401).json({ error: "Contraseña incorrecta" });

    req.mood = mood;
    next();
};

exports.getAllMoods = function(req, res) {
    let userMoods = moods.filter(mood => mood.id_user === req.user.id);

    // Filtrar por rango de fechas
    if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        userMoods = userMoods.filter(mood => {
            const moodDate = new Date(mood.date);
            return moodDate >= startDate && moodDate <= endDate;
        });
    }

    // Filtrar por label
    if (req.query.label) {
        userMoods = userMoods.filter(mood => mood.label === req.query.label);
    }

    // Ordenar por fecha descendente (más reciente primero)
    userMoods.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Paginación
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const total = userMoods.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const data = userMoods.slice(startIndex, endIndex);
    const next_page = endIndex < total ? page + 1 : null;

    res.status(200).json({ 
        page, 
        next_page, 
        limit, 
        total, 
        data 
    });
};

exports.getMood = function(req, res) {
    res.status(200).json(req.mood);
};

exports.getWeeklyMoods = function(req, res) {
    const userMoods = moods.filter(m => m.id_user === req.user.id);
    
    // Obtener últimos 7 días
    const today = new Date();
    const weekMoods = {};

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const moodForDay = userMoods.find(m => m.date.split('T')[0] === dateKey);
        weekMoods[dateKey] = moodForDay || null;
    }

    res.status(200).json(weekMoods);
};

exports.getTodayMood = function(req, res) {
    const today = new Date().toISOString().split('T')[0];
    const userMoods = moods.filter(m => m.id_user === req.user.id);
    const todayMood = userMoods.find(m => m.date.split('T')[0] === today);

    if (!todayMood) {
        return res.status(404).json({ error: "No hay registro de mood para hoy" });
    }

    res.status(200).json(todayMood);
};

// ==========================================
// FUNCIONES DE ACTUALIZACIÓN
// ==========================================

exports.updateMood = function(req, res) {
    const { moodValue } = req.body;

    if (moodValue === undefined) {
        return res.status(400).json({ 
            error: "Debes enviar el valor de mood para actualizar" 
        });
    }

    let mood = req.mood;
    const moodIndex = moods.findIndex(m => m.id === mood.id);

    try {
        // Crear un nuevo Mood para validar
        const tempMood = new Mood(moodValue, mood.id_user, mood.date);
        moods[moodIndex].moodValue = tempMood.moodValue;
        moods[moodIndex].label = tempMood.label;
        moods[moodIndex].updatedAt = new Date().toISOString();
    } catch (error) {
        return res.status(400).json({ error: error.errorMessage });
    }

    fs.writeFileSync(
        path.join(__dirname, '../database/moods.json'),
        JSON.stringify(moods, null, 2),
        'utf-8'
    );

    res.status(200).json({ 
        message: "¡Mood actualizado correctamente!",
        mood: moods[moodIndex]
    });
};

// ==========================================
// FUNCIONES DE ELIMINACIÓN
// ==========================================

exports.deleteMood = function(req, res) {
    let mood = req.mood;
    const index = moods.findIndex(m => m.id === mood.id);
    
    if (index !== -1) {
        moods.splice(index, 1);
    }

    fs.writeFileSync(
        path.join(__dirname, '../database/moods.json'),
        JSON.stringify(moods, null, 2),
        'utf-8'
    );

    res.status(200).json({ 
        message: `¡Mood ${mood.id} eliminado correctamente!`,
        mood 
    });
};