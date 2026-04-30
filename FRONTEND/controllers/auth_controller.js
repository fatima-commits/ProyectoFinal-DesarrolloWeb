const local_url = "http://localhost:3000/";

// Validar sesión
function validateSession() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = local_url + 'login.html';
        return false;
    }
    return true;
}

// Login
function performLogin(email, password) {
    fetch(local_url + 'login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error en login');
            });
        }
        return response.json();
    })
    .then(data => {
        // Guardar usuario CON contraseña (necesaria para autenticación)
        sessionStorage.setItem('user', JSON.stringify(data.user));
        // Guardar contraseña por separado también (backup)
        sessionStorage.setItem('password', password);
        
        console.log('✅ Login exitoso:', data.user.email);
        window.location.href = local_url + 'home.html';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ ' + error.message);
    });
}

// Register
function performRegister(name, email, password, confirmPassword) {
    if (password !== confirmPassword) {
        alert('❌ Las contraseñas no coinciden');
        return;
    }

    if (password.length < 8) {
        alert('❌ La contraseña debe tener al menos 8 caracteres');
        return;
    }

    fetch(local_url + 'register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error en registro');
            });
        }
        return response.json();
    })
    .then(data => {
        // Guardar usuario CON contraseña
        sessionStorage.setItem('user', JSON.stringify(data.user));
        // Guardar contraseña por separado también
        sessionStorage.setItem('password', password);
        
        console.log('✅ Registro exitoso:', data.user.email);
        alert('✅ ¡Registro exitoso! Bienvenido ' + data.user.name);
        window.location.href = local_url + 'home.html';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('❌ ' + error.message);
    });
}

// Logout
function logout() {
    sessionStorage.clear();
    window.location.href = local_url;
}

if (document.getElementById('btnLogout')) {
    document.getElementById('btnLogout').addEventListener('click', logout);
}