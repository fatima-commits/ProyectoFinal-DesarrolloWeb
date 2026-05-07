const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título no puede estar vacío']
    },
    trigger: {
        type: String,
        required: [true, 'El trigger no puede estar vacío']
    },
    days: {
        type: [Number],
        validate: {
            validator: (arr) => arr.length > 0 && arr.every(d => d >= 1 && d <= 7),
            message: 'Los días deben ser números entre 1 y 7'
        }
    },
    color: {
        type: String,
        enum: {
            values: ['orange', 'pink', 'purple', 'cyan'],
            message: 'Color inválido'
        }
    },
    icon: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed'],
        default: 'active'
    },
    id_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);