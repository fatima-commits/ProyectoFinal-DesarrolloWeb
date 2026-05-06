const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://admin:MaRiAn4%3B@m0.vz2zmve.mongodb.net/loop_db?appName=M0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch((err) => console.error('Error al conectar a MongoDB:', err));

module.exports = mongoose;