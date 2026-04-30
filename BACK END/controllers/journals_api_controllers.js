const fs = require('fs');
const path = require('path');
const { Journal, JournalException, journals } = require('../models/journal');

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

exports.createJournal = function(req, res) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const users = getUsers();
    let user = users.find(u => u.contraseña === auth);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const { title, content, mood, date } = req.body;

    // Validaciones
    if (!title) return res.status(400).json({ error: "El título es obligatorio" });
    if (!content) return res.status(400).json({ error: "El contenido es obligatorio" });

    let newJournal;
    try {
        newJournal = new Journal(title, content, user.id, mood || '😊', [], date || new Date());
    } catch (error) {
        return res.status(400).json({ error: error.errorMessage });
    }

    journals.push(newJournal.toObj());
    fs.writeFileSync(
        path.join(__dirname, '../database/journals.json'),
        JSON.stringify(journals, null, 2),
        'utf-8'
    );

    res.status(201).json({
        message: "¡Entrada de diario creada exitosamente!",
        journal: newJournal.toObj()
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

exports.authJournalsMiddleware = function(req, res, next) {
    const auth = req.headers['x-auth'];
    const id_journal = req.params.id;

    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    let journal = journals.find(j => j.id === Number(id_journal));
    if (!journal) return res.status(404).json({ error: "Entrada de diario no encontrada" });

    const users = getUsers();
    let user = users.find(u => u.id === journal.id_user);
    if (auth !== user.contraseña) return res.status(401).json({ error: "Contraseña incorrecta" });

    req.journal = journal;
    next();
};

exports.getAllJournals = function(req, res) {
    let userJournals = journals.filter(journal => journal.id_user === req.user.id);

    // Filtrar por rango de fechas
    if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        userJournals = userJournals.filter(journal => {
            const journalDate = new Date(journal.date);
            return journalDate >= startDate && journalDate <= endDate;
        });
    }

    // Filtrar por mood
    if (req.query.mood) {
        userJournals = userJournals.filter(journal => journal.mood === req.query.mood);
    }

    // Ordenar por fecha descendente (más reciente primero)
    userJournals.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Paginación
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const total = userJournals.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const data = userJournals.slice(startIndex, endIndex);
    const next_page = endIndex < total ? page + 1 : null;

    res.status(200).json({ 
        page, 
        next_page, 
        limit, 
        total, 
        data 
    });
};

exports.getJournal = function(req, res) {
    res.status(200).json(req.journal);
};

exports.getJournalsByDate = function(req, res) {
    const date = req.query.date;
    if (!date) {
        return res.status(400).json({ error: "Se requiere parámetro 'date'" });
    }

    const targetDate = new Date(date).toISOString().split('T')[0];
    const userJournals = journals.filter(j => 
        j.id_user === req.user.id && 
        j.date.split('T')[0] === targetDate
    );

    res.status(200).json(userJournals);
};

// ==========================================
// FUNCIONES DE ACTUALIZACIÓN
// ==========================================

exports.updateJournal = function(req, res) {
    const { title, content, mood, date } = req.body;

    // Validar que al menos un campo sea enviado
    if (!title && !content && !mood && !date) {
        return res.status(400).json({ 
            error: "Debes enviar al menos un campo para actualizar" 
        });
    }

    let journal = req.journal;
    const journalIndex = journals.findIndex(j => j.id === journal.id);

    try {
        if (title) journals[journalIndex].title = title;
        if (content) journals[journalIndex].content = content;
        if (mood) journals[journalIndex].mood = mood;
        if (date) journals[journalIndex].date = date;
        journals[journalIndex].updatedAt = new Date().toISOString();
    } catch (error) {
        return res.status(400).json({ error: error.errorMessage });
    }

    fs.writeFileSync(
        path.join(__dirname, '../database/journals.json'),
        JSON.stringify(journals, null, 2),
        'utf-8'
    );

    res.status(200).json({ 
        message: "¡Entrada de diario actualizada correctamente!",
        journal: journals[journalIndex]
    });
};

// ==========================================
// FUNCIONES DE IMÁGENES
// ==========================================

exports.uploadImage = function(req, res) {
    const auth = req.headers['x-auth'];
    const journalId = req.params.id;

    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });
    if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });

    const users = getUsers();
    let user = users.find(u => u.contraseña === auth);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    // Encontrar la entrada de diario
    let journal = journals.find(j => j.id === Number(journalId));
    if (!journal) return res.status(404).json({ error: "Entrada de diario no encontrada" });

    // Verificar que el usuario es propietario
    if (journal.id_user !== user.id) {
        return res.status(401).json({ error: "No tienes permiso para modificar esta entrada" });
    }

    // Verificar límite de imágenes
    if (journal.images.length >= 10) {
        return res.status(400).json({ error: "Máximo 10 imágenes por entrada" });
    }

    // Construir ruta de la imagen
    const imagePath = `/uploads/journals/${req.file.filename}`;
    
    // Agregar imagen a la entrada
    const journalIndex = journals.findIndex(j => j.id === Number(journalId));
    journals[journalIndex].images.push(imagePath);
    journals[journalIndex].updatedAt = new Date().toISOString();

    fs.writeFileSync(
        path.join(__dirname, '../database/journals.json'),
        JSON.stringify(journals, null, 2),
        'utf-8'
    );

    res.status(200).json({
        message: "¡Imagen cargada exitosamente!",
        image: imagePath,
        journal: journals[journalIndex]
    });
};

exports.deleteImage = function(req, res) {
    const auth = req.headers['x-auth'];
    const journalId = req.params.id;
    const imagePath = req.body.imagePath;

    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });
    if (!imagePath) return res.status(400).json({ error: "Se requiere 'imagePath'" });

    const users = getUsers();
    let user = users.find(u => u.contraseña === auth);
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    // Encontrar la entrada de diario
    let journal = journals.find(j => j.id === Number(journalId));
    if (!journal) return res.status(404).json({ error: "Entrada de diario no encontrada" });

    // Verificar que el usuario es propietario
    if (journal.id_user !== user.id) {
        return res.status(401).json({ error: "No tienes permiso para modificar esta entrada" });
    }

    const journalIndex = journals.findIndex(j => j.id === Number(journalId));
    const imageIndex = journals[journalIndex].images.indexOf(imagePath);

    if (imageIndex === -1) {
        return res.status(404).json({ error: "Imagen no encontrada en esta entrada" });
    }

    // Eliminar archivo físico si existe
    const fileFullPath = path.join(__dirname, `../../FRONTEND/public${imagePath}`);
    if (fs.existsSync(fileFullPath)) {
        fs.unlinkSync(fileFullPath);
    }

    // Eliminar referencia de la BD
    journals[journalIndex].images.splice(imageIndex, 1);
    journals[journalIndex].updatedAt = new Date().toISOString();

    fs.writeFileSync(
        path.join(__dirname, '../database/journals.json'),
        JSON.stringify(journals, null, 2),
        'utf-8'
    );

    res.status(200).json({
        message: "¡Imagen eliminada correctamente!",
        journal: journals[journalIndex]
    });
};

// ==========================================
// FUNCIONES DE ELIMINACIÓN
// ==========================================

exports.deleteJournal = function(req, res) {
    let journal = req.journal;
    const index = journals.findIndex(j => j.id === journal.id);
    
    if (index !== -1) {
        // Eliminar imágenes asociadas
        journal.images.forEach(imagePath => {
            const fileFullPath = path.join(__dirname, `../../FRONTEND/public${imagePath}`);
            if (fs.existsSync(fileFullPath)) {
                fs.unlinkSync(fileFullPath);
            }
        });

        journals.splice(index, 1);
    }

    fs.writeFileSync(
        path.join(__dirname, '../database/journals.json'),
        JSON.stringify(journals, null, 2),
        'utf-8'
    );

    res.status(200).json({ 
        message: `¡Entrada de diario ${journal.id} eliminada correctamente!`,
        journal 
    });
};