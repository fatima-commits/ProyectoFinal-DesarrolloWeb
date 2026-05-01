const fs = require('fs');
const path = require('path');

let moods = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/moods.json'), 'utf-8')
);
let users = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/users.json'), 'utf-8')
);

function getNextMoodID() {
    if (moods.length === 0) {
        return 1;
    }
    return moods[moods.length - 1].id + 1;
}

class MoodException {
    constructor(errorMessage) {
        this.errorMessage = errorMessage;
    }
}

class Mood {
    #id;
    #moodValue;
    #label;
    #date;
    #id_user;
    #createdAt;
    #updatedAt;

    constructor(moodValue, id_user, date = new Date()) {
        this.#id = getNextMoodID();
        this.moodValue = moodValue;
        this.date = date;
        this.#id_user = id_user;
        this.#createdAt = new Date().toISOString();
        this.#updatedAt = new Date().toISOString();
    }

    // GETTERS
    get id() { return this.#id; }
    get moodValue() { return this.#moodValue; }
    get label() { return this.#label; }
    get date() { return this.#date; }
    get id_user() { return this.#id_user; }
    get createdAt() { return this.#createdAt; }
    get updatedAt() { return this.#updatedAt; }

    // SETTERS
    set id(value) {
        throw new MoodException("Los IDs de mood se generan automáticamente");
    }

    set moodValue(value) {
        const num = Number(value);
        
        if (isNaN(num)) {
            throw new MoodException("El valor de mood debe ser un número");
        }
        
        if (num < 0 || num > 100) {
            throw new MoodException("El valor de mood debe estar entre 0 y 100");
        }
        
        this.#moodValue = Math.round(num);
        
        // Asignar label según valor
        if (num < 25) {
            this.#label = 'Angry';
        } else if (num < 50) {
            this.#label = 'Sad';
        } else if (num < 75) {
            this.#label = 'Okay';
        } else {
            this.#label = 'Happy';
        }
    }

    set date(value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new MoodException("Formato de fecha inválido");
        }
        this.#date = date.toISOString();
    }

    set id_user(value) {
        let existe = users.find(function(user) {
            return user.id === value;
        });

        if (!existe) {
            throw new MoodException("El usuario no existe");
        }

        this.#id_user = value;
    }

    set createdAt(value) {
        throw new MoodException("La fecha de creación no puede ser modificada");
    }

    set updatedAt(value) {
        this.#updatedAt = new Date().toISOString();
    }

    toObj() {
        return {
            id: this.id,
            moodValue: this.moodValue,
            label: this.label,
            date: this.date,
            id_user: this.id_user,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = { Mood, MoodException, moods };