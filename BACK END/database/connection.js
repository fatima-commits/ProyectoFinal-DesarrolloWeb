const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://admin:MaRiAn4%3B@ac-l7f9ayl-shard-00-00.vz2zmve.mongodb.net:27017,ac-l7f9ayl-shard-00-01.vz2zmve.mongodb.net:27017,ac-l7f9ayl-shard-00-02.vz2zmve.mongodb.net:27017/loop_db?ssl=true&replicaSet=atlas-xo1ayr-shard-0&authSource=admin&appName=M0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch((err) => console.error('Error al conectar a MongoDB:', err));

module.exports = mongoose;