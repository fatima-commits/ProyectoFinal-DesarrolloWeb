class Habit {
    constructor(after, going_to, days = [], color = 'orange', icon = '✓', id_user) {
        this.id = Date.now();
        this.after = after; // "Después de lavarme los dientes"
        this.going_to = going_to; // "Voy a salir a caminar"
        this.days = days;
        this.color = color;
        this.icon = icon;
        this.id_user = id_user; // ID del usuario
        this.active = true; 
        this.created_at = new Date(); 
        this.completed_today = false;
    }

    toObject() {
        return {
            id: this.id,
            after: this.after,
            going_to: this.going_to,
            days: this.days,
            color: this.color,
            icon: this.icon,
            id_user: this.id_user,
            active: this.active,
            created_at: this.created_at,
            completed_today: this.completed_today
        };
    }

    // Método para marcar como completado hoy
    markAsCompletedToday() {
        this.completed_today = true;
    }

    // Método para marcar como no completado hoy
    markAsNotCompletedToday() {
        this.completed_today = false;
    }

    // Método para verificar si el hábito es para un día específico
    isScheduledForDay(day) {
        return this.days.includes(day);
    }

    // Método para toggle del estado activo
    toggleActive() {
        this.active = !this.active;
    }
}

module.exports = Habit;