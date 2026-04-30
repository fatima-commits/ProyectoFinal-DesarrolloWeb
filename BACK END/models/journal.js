const fs = require('fs');
const path = require('path');

let journals = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/journals.json'), 'utf-8')
);
let users = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/users.json'), 'utf-8')
);

function getNextJournalID() {
    if (journals.length === 0) {
        return 1;
    }
    return journals[journals.length - 1].id + 1;
}

class JournalException {
    constructor(errorMessage) {
        this.errorMessage = errorMessage;
    }
}

class Journal {
    #id;
    #title;
    #content;
    #mood;
    #images;
    #date;
    #id_user;
    #createdAt;
    #updatedAt;

    constructor(title, content, id_user, mood = '😊', images = [], date = new Date()) {
        this.#id = getNextJournalID();
        this.title = title;
        this.content = content;
        this.mood = mood;
        this.images = images;
        this.date = date;
        this.#id_user = id_user;
        this.#createdAt = new Date().toISOString();
        this.#updatedAt = new Date().toISOString();
    }

    // GETTERS
    get id() { return this.#id; }
    get title() { return this.#title; }
    get content() { return this.#content; }
    get mood() { return this.#mood; }
    get images() { return this.#images; }
    get date() { return this.#date; }
    get id_user() { return this.#id_user; }
    get createdAt() { return this.#createdAt; }
    get updatedAt() { return this.#updatedAt; }

    // SETTERS
    set id(value) {
        throw new JournalException("Los IDs de entrada se generan automáticamente");
    }

    set title(value) {
        if (!value || value.trim() === "") {
            throw new JournalException("El título no puede estar vacío");
        }
        if (value.length > 200) {
            throw new JournalException("El título no debe exceder 200 caracteres");
        }
        this.#title = value;
    }

    set content(value) {
        if (!value || value.trim() === "") {
            throw new JournalException("El contenido no puede estar vacío");
        }
        if (value.length > 5000) {
            throw new JournalException("El contenido no puede exceder 5000 caracteres");
        }
        this.#content = value;
    }

    set mood(value) {
        const validMoods = ['😊', '😌', '😢', '😡', '😴', '🤔', '😍', '😱'];
        if (!validMoods.includes(value)) {
            throw new JournalException(`El mood debe ser uno de: ${validMoods.join(' ')}`);
        }
        this.#mood = value;
    }

    set date(value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new JournalException("Formato de fecha inválido");
        }
        this.#date = date.toISOString();
    }

    set images(value) {
        if (!Array.isArray(value)) {
            throw new JournalException("Las imágenes deben ser un arreglo");
        }
        if (value.length > 10) {
            throw new JournalException("Máximo 10 imágenes por entrada");
        }
        // Validar que cada imagen sea un string (ruta de archivo)
        value.forEach(img => {
            if (typeof img !== 'string') {
                throw new JournalException("Cada imagen debe ser una ruta válida");
            }
        });
        this.#images = value;
    }

    set id_user(value) {
        let existe = users.find(function(user) {
            return user.id === value;
        });

        if (!existe) {
            throw new JournalException("El usuario no existe");
        }

        this.#id_user = value;
    }

    set createdAt(value) {
        throw new JournalException("La fecha de creación no puede ser modificada");
    }

    set updatedAt(value) {
        this.#updatedAt = new Date().toISOString();
    }

    addImage(imagePath) {
        if (this.#images.length >= 10) {
            throw new JournalException("Máximo 10 imágenes por entrada");
        }
        this.#images.push(imagePath);
        this.#updatedAt = new Date().toISOString();
    }

    removeImage(imagePath) {
        const index = this.#images.indexOf(imagePath);
        if (index > -1) {
            this.#images.splice(index, 1);
            this.#updatedAt = new Date().toISOString();
        }
    }

    toObj() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            mood: this.mood,
            images: this.images,
            date: this.date,
            id_user: this.id_user,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = { Journal, JournalException, journals };