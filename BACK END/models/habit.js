const fs = require('fs');
const path = require('path');

let habits = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/habits.json'), 'utf-8')
);
let users = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/users.json'), 'utf-8')
);

function getNextHabitID() {
    if (habits.length === 0) {
        return 1;
    }
    return habits[habits.length - 1].id + 1;
}

class HabitException {
    constructor(errorMessage) {
        this.errorMessage = errorMessage;
    }
}

class Habit {
    #id;
    #title;
    #trigger;
    #days;
    #color;
    #icon;
    #status;
    #id_user;
    #createdAt;

    constructor(title, trigger, days, color, icon, id_user, status = 'active') {
        this.#id = getNextHabitID();
        this.title = title;
        this.trigger = trigger;
        this.days = days;
        this.color = color;
        this.icon = icon;
        this.#id_user = id_user;
        this.status = status;
        this.#createdAt = new Date().toISOString();
    }

    // GETTERS
    get id() { return this.#id; }
    get title() { return this.#title; }
    get trigger() { return this.#trigger; }
    get days() { return this.#days; }
    get color() { return this.#color; }
    get icon() { return this.#icon; }
    get status() { return this.#status; }
    get id_user() { return this.#id_user; }
    get createdAt() { return this.#createdAt; }

    // SETTERS
    set id(value) {
        throw new HabitException("Los IDs de hábito se generan automáticamente");
    }

    set title(value) {
        if (!value || value.trim() === "") {
            throw new HabitException("El título del hábito no puede estar vacío");
        }
        this.#title = value;
    }

    set trigger(value) {
        if (!value || value.trim() === "") {
            throw new HabitException("El disparador (trigger) no puede estar vacío");
        }
        this.#trigger = value;
    }

    set days(value) {
        if (!Array.isArray(value)) {
            throw new HabitException("Los días deben ser un arreglo");
        }
        
        if (value.length === 0) {
            throw new HabitException("Debe seleccionar al menos un día");
        }

        // Validar que todos los valores sean números entre 1 y 7
        const validDays = value.every(day => 
            Number.isInteger(day) && day >= 1 && day <= 7
        );
        
        if (!validDays) {
            throw new HabitException("Los días deben ser números entre 1 y 7 (L=1, M=2, M=3, J=4, V=5, S=6, D=7)");
        }

        // Eliminar duplicados y ordenar
        this.#days = [...new Set(value)].sort();
    }

    set color(value) {
        const validColors = ['orange', 'pink', 'purple', 'cyan'];
        if (!validColors.includes(value)) {
            throw new HabitException(`El color debe ser uno de: ${validColors.join(', ')}`);
        }
        this.#color = value;
    }

    set icon(value) {
        if (!value || value.trim() === "") {
            throw new HabitException("El icono no puede estar vacío");
        }
        this.#icon = value;
    }

    set id_user(value) {
        let existe = users.find(function(user) {
            return user.id === value;
        });

        if (!existe) {
            throw new HabitException("El usuario no existe");
        }

        this.#id_user = value;
    }

    set status(value) {
        const validStatus = ['active', 'paused', 'completed'];
        if (!validStatus.includes(value)) {
            throw new HabitException(`El estado debe ser: ${validStatus.join(', ')}`);
        }
        this.#status = value;
    }

    set createdAt(value) {
        throw new HabitException("La fecha de creación no puede ser modificada");
    }

    toObj() {
        return {
            id: this.id,
            title: this.title,
            trigger: this.trigger,
            days: this.days,
            color: this.color,
            icon: this.icon,
            status: this.status,
            id_user: this.id_user,
            createdAt: this.createdAt
        };
    }
}

module.exports = { Habit, HabitException, habits };