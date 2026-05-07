const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
    moodValue: {
        type: Number,
        required: true,
        min: [0, 'El valor mínimo es 0'],
        max: [100, 'El valor máximo es 100']
    },
    label: {
        type: String,
        enum: ['Angry', 'Sad', 'Okay', 'Happy']
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

moodSchema.pre('save', async function() {
    if (this.moodValue < 25) this.label = 'Angry';
    else if (this.moodValue < 50) this.label = 'Sad';
    else if (this.moodValue < 75) this.label = 'Okay';
    else this.label = 'Happy';
});

module.exports = mongoose.model('Mood', moodSchema);