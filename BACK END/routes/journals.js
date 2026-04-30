const express = require('express');
const multer = require('multer');
const path = require('path');
const routerJournals = express.Router();
const journalsController = require('../controllers/journals_api_controllers');

// CONFIGURACIÓN DE MULTER
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../FRONTEND/public/uploads/journals');
        // Crear directorio si no existe
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Usar timestamp + nombre original para evitar conflictos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Permitir solo imágenes
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// ==========================================
// RUTAS
// ==========================================

// POST /journals - Crear nuevo journal (requiere autenticación)
routerJournals.post(
    '/',
    journalsController.authUserMiddleware,
    journalsController.createJournal
);

// GET /journals - Obtener todos los journals del usuario (requiere autenticación)
routerJournals.get(
    '/',
    journalsController.authUserMiddleware,
    journalsController.getAllJournals
);

// GET /journals/date/:date - Obtener entrada de una fecha específica
routerJournals.get(
    '/date/:date',
    journalsController.authUserMiddleware,
    journalsController.getJournalsByDate
);

// GET /journals/:id - Obtener un journal específico
routerJournals.get(
    '/:id',
    journalsController.authJournalsMiddleware,
    journalsController.getJournal
);

// PATCH /journals/:id - Actualizar un journal
routerJournals.patch(
    '/:id',
    journalsController.authJournalsMiddleware,
    journalsController.updateJournal
);

// DELETE /journals/:id - Eliminar un journal
routerJournals.delete(
    '/:id',
    journalsController.authJournalsMiddleware,
    journalsController.deleteJournal
);

// ==========================================
// RUTAS DE IMÁGENES
// ==========================================

// POST /journals/:id/upload - Subir imagen a una entrada
routerJournals.post(
    '/:id/upload',
    upload.single('image'),
    journalsController.uploadImage
);

// DELETE /journals/:id/image - Eliminar imagen de una entrada
routerJournals.delete(
    '/:id/image',
    journalsController.authJournalsMiddleware,
    journalsController.deleteImage
);

module.exports = routerJournals;