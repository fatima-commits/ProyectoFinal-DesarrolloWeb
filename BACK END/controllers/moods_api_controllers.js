const Mood = require('../models/mood');
const User = require('../models/user');

exports.authUserMiddleware = async function(req, res, next) {
    try {
        const auth = req.headers['x-auth'];
        if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

        const user = await User.findOne({ contraseña: auth });
        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.authMoodsMiddleware = async function(req, res, next) {
    try {
        const auth = req.headers['x-auth'];
        if (!auth) return res.status(401).json({ error: "Acceso no autorizado" });

        const mood = await Mood.findById(req.params.id);
        if (!mood) return res.status(404).json({ error: "Mood no encontrado" });

        const user = await User.findOne({ contraseña: auth });
        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        if (mood.id_user.toString() !== user._id.toString())
            return res.status(401).json({ error: "No tienes permiso" });

        req.mood = mood;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createMood = async function(req, res) {
    try {
        const auth = req.headers['x-auth'];
        
        const user = await User.findOne({ contraseña: auth });
        
        const { moodValue, date } = req.body;

        const newMood = new Mood({
            moodValue: Math.round(Number(moodValue)),
            date: date || new Date(),
            id_user: user._id
        });
        
        await newMood.save();
        res.status(201).json({ message: "¡Mood registrado!", mood: newMood });
    } catch (err) {
        console.log('ERROR:', err.message);
        res.status(400).json({ error: err.message });
    }
};

exports.getAllMoods = async function(req, res) {
    const filter = { id_user: req.user._id };

    if (req.query.startDate && req.query.endDate) {
        filter.date = {
            $gte: new Date(req.query.startDate),
            $lte: new Date(req.query.endDate)
        };
    }

    if (req.query.label) filter.label = req.query.label;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const total = await Mood.countDocuments(filter);
    const data = await Mood.find(filter).sort({ date: -1 }).skip(skip).limit(limit);
    const next_page = skip + limit < total ? page + 1 : null;

    res.status(200).json({ page, next_page, limit, total, data });
};

exports.getMood = function(req, res) {
    res.status(200).json(req.mood);
};

exports.getTodayMood = async function(req, res) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const mood = await Mood.findOne({
        id_user: req.user._id,
        date: { $gte: start, $lte: end }
    });

    if (!mood) return res.status(404).json({ error: "No hay mood para hoy" });

    res.status(200).json(mood);
};

exports.getWeeklyMoods = async function(req, res) {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const moods = await Mood.find({
        id_user: req.user._id,
        date: { $gte: weekAgo }
    }).sort({ date: 1 });

    const result = {};
    moods.forEach(mood => {
        const dateKey = new Date(mood.date).toISOString().split('T')[0];
        result[dateKey] = mood;
    });

    res.status(200).json(result);
};

exports.updateMood = async function(req, res) {
    const { moodValue } = req.body;
    if (moodValue === undefined)
        return res.status(400).json({ error: "Debes enviar el valor de mood" });

    const num = Math.round(Number(moodValue));
    let label;
    if (num < 25) label = 'Angry';
    else if (num < 50) label = 'Sad';
    else if (num < 75) label = 'Okay';
    else label = 'Happy';

    try {
        const updated = await Mood.findByIdAndUpdate(
            req.mood._id,
            { moodValue: num, label },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "¡Mood actualizado!", mood: updated });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteMood = async function(req, res) {
    await Mood.findByIdAndDelete(req.mood._id);
    res.status(200).json({ message: "¡Mood eliminado!", mood: req.mood });
};