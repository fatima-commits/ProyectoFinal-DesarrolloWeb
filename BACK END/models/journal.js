const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título no puede estar vacío'],
        maxlength: [200, 'El título no debe exceder 200 caracteres']
    },
    content: {
        type: String,
        required: [true, 'El contenido no puede estar vacío'],
        maxlength: [5000, 'El contenido no puede exceder 5000 caracteres']
    },
    mood: {
        type: String,
        enum: ['😊', '😌', '😢', '😡', '😴', '🤔', '😍', '😱'],
        default: '😊'
    },
    images: {
        type: [String],
        default: []
    },
    date: {
        type: Date,
        default: Date.now
    },
    id_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Journal', journalSchema);