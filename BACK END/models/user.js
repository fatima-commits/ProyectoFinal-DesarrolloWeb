const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre no puede estar vacío']
    },
    email: {
        type: String,
        required: [true, 'El email no puede estar vacío'],
        unique: true
    },
    contraseña: {
        type: String,
        required: [true, 'La contraseña no puede estar vacía'],
        minlength: [8, 'La contraseña debe tener 8 o más caracteres']
    },
    joined_at: {
        type: Date,
        default: Date.now
    },
    weight: Number,
    height: Number
});

module.exports = mongoose.model('User', userSchema);