function toggleForms() {
    let form_login = document.getElementById('formLogin'),
        form_register = document.getElementById('formRegister');
    if (form_register.style.display == 'none') {
        form_login.style.display = 'none';
        form_register.style.display = 'block';
    }
    else {
        form_login.style.display = 'block';
        form_register.style.display = 'none';
    }
}

function login(event) {
    event.preventDefault();
    let data = new FormData(event.target);

    fetch(local_url + 'login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(data.entries()))
    })
    .then(response => {
        if (!response.ok) alert("Correo y/o contraseña incorrectos");
        return response.json();
    })
    .then(user => {
        // Agregar la contraseña al objeto user antes de guardar
        user.contraseña = data.get('password');
        sessionStorage.setItem('user', JSON.stringify(user));
        window.location.href = local_url + 'home.html';
    })
    .catch(err => {
        console.error("Error en login:", err);
    });
}

function register(event) {
    event.preventDefault();
    let data = new FormData(event.target);
    let formData = Object.fromEntries(data.entries());

    if (formData.password !== formData.confirm_password) {
        alert("Las contraseñas no coinciden");
        return;
    }

    fetch(local_url + 'register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || "Error al registrar usuario");
            });
        }
        return response.json();
    })
    .then(user => {
        // Guardar usuario con contraseña
        user.contraseña = formData.password;
        sessionStorage.setItem('user', JSON.stringify(user));
        window.location.href = local_url + 'home.html';
    })
    .catch(err => {
        console.error("Error en registro:", err);
        alert(err.message);
    });
}

function logout() {
    sessionStorage.clear();
    window.location.href = local_url;
}