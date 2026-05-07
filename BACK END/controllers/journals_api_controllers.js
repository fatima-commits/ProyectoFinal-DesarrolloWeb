const Journal = require('../models/journal');
const User = require('../models/user');
const path = require('path');
const fs = require('fs');

exports.authUserMiddleware = async function(req, res, next) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const user = await User.findOne({ contraseña: auth });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    req.user = user;
    next();
};

exports.authJournalsMiddleware = async function(req, res, next) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ error: "Entrada no encontrada" });

    const user = await User.findOne({ contraseña: auth });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    if (journal.id_user.toString() !== user._id.toString())
        return res.status(401).json({ error: "No tienes permiso" });

    req.journal = journal;
    next();
};

exports.createJournal = async function(req, res) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const user = await User.findOne({ contraseña: auth });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const { title, content, mood, date } = req.body;

    if (!title) return res.status(400).json({ error: "El título es obligatorio" });
    if (!content) return res.status(400).json({ error: "El contenido es obligatorio" });

    try {
        const newJournal = await Journal.create({
            title, content,
            mood: mood || '😊',
            images: [],
            date: date || new Date(),
            id_user: user._id
        });

        res.status(201).json({ message: "¡Entrada creada!", journal: newJournal });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllJournals = async function(req, res) {
    const filter = { id_user: req.user._id };

    if (req.query.startDate && req.query.endDate) {
        filter.date = {
            $gte: new Date(req.query.startDate),
            $lte: new Date(req.query.endDate)
        };
    }

    if (req.query.mood) filter.mood = req.query.mood;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const total = await Journal.countDocuments(filter);
    const data = await Journal.find(filter).sort({ date: -1 }).skip(skip).limit(limit);
    const next_page = skip + limit < total ? page + 1 : null;

    res.status(200).json({ page, next_page, limit, total, data });
};

exports.getJournal = function(req, res) {
    res.status(200).json(req.journal);
};

exports.getJournalsByDate = async function(req, res) {
    const date = req.query.date;
    if (!date) return res.status(400).json({ error: "Se requiere parámetro 'date'" });

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const journals = await Journal.find({
        id_user: req.user._id,
        date: { $gte: start, $lte: end }
    });

    res.status(200).json(journals);
};

exports.updateJournal = async function(req, res) {
    const { title, content, mood, date } = req.body;

    if (!title && !content && !mood && !date)
        return res.status(400).json({ error: "Debes enviar al menos un campo" });

    const updates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (mood) updates.mood = mood;
    if (date) updates.date = date;

    try {
        const updated = await Journal.findByIdAndUpdate(
            req.journal._id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "¡Entrada actualizada!", journal: updated });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.uploadImage = async function(req, res) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });
    if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });

    const user = await User.findOne({ contraseña: auth });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ error: "Entrada no encontrada" });

    if (journal.id_user.toString() !== user._id.toString())
        return res.status(401).json({ error: "No tienes permiso" });

    if (journal.images.length >= 10)
        return res.status(400).json({ error: "Máximo 10 imágenes" });

    const imagePath = `/uploads/journals/${req.file.filename}`;
    const updated = await Journal.findByIdAndUpdate(
        journal._id,
        { $push: { images: imagePath } },
        { new: true }
    );

    res.status(200).json({ message: "¡Imagen cargada!", image: imagePath, journal: updated });
};

exports.deleteImage = async function(req, res) {
    const auth = req.headers['x-auth'];
    if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

    const { imagePath } = req.body;
    if (!imagePath) return res.status(400).json({ error: "Se requiere 'imagePath'" });

    const user = await User.findOne({ contraseña: auth });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ error: "Entrada no encontrada" });

    if (journal.id_user.toString() !== user._id.toString())
        return res.status(401).json({ error: "No tienes permiso" });

    const updated = await Journal.findByIdAndUpdate(
        journal._id,
        { $pull: { images: imagePath } },
        { new: true }
    );

    res.status(200).json({ message: "¡Imagen eliminada!", journal: updated });
};

exports.deleteJournal = async function(req, res) {
    await Journal.findByIdAndDelete(req.journal._id);
    res.status(200).json({ message: "¡Entrada eliminada!", journal: req.journal });
};