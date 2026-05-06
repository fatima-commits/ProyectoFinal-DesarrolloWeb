function toggleForms() {
    let formLogin    = document.getElementById('formLogin');
    let formRegister = document.getElementById('formRegister');
    if (formLogin.style.display === 'none') {
        formLogin.style.display    = 'block';
        formRegister.style.display = 'none';
    } else {
        formLogin.style.display    = 'none';
        formRegister.style.display = 'block';
    }
}

//Funcion Login
function login(event) {
    event.preventDefault();
    let data = new FormData(event.target);

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries()))
    })
    .then(response => {
        if (!response.ok) alert("Correo y/o contraseña incorrectos");
        return response.json();
    })
    .then(user => {
        //El backend no regresa la pswd en user asi que lo guardamos separado
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('password', Object.fromEntries(data.entries()).password);
        window.location.href = local_url + 'home.html';
    })
    .catch(err => console.error("Error en login:", err));
}

function register(event) {
    event.preventDefault();
    let data = new FormData(event.target);
    let entries = Object.fromEntries(data.entries());

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries)
    })
    .then(response => {
        if (!response.ok) {
            alert("Error al crear la cuenta. Verifica tus datos.");
            return null;
        }
        return response.json();
    })
    .then(user => {
        if (!user) return;
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('password', entries.password);
        window.location.href = local_url + 'home.html';
    })
    .catch(err => console.error("Error en register:", err));
}

//Logout
function logout() {
    sessionStorage.clear();
    window.location.href = local_url;
}

//Editar usuario
function populateModal() {
    let user = JSON.parse(sessionStorage.getItem('user'));
    document.getElementById('edit_name').value  = user.name;
    document.getElementById('edit_email').value = user.email;
    document.getElementById('edit_pswd').value  = sessionStorage.getItem('password');
}

//Guardar cambios en usuario
function saveUserChanges() {
    let user = JSON.parse(sessionStorage.getItem('user'));

    let name     = document.querySelector('.name-input').value;
    let email    = document.querySelector('input[type="email"]').value;
    let password = document.getElementById('passwordInput').value;
    let weight   = document.getElementById('weightInput').value;
    let height   = document.getElementById('heightInput').value;

    if (!name || !email || !password) {
        alert("Nombre, email y contraseña son obligatorios");
        return;
    }

    fetch(`/users/${user.id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': sessionStorage.getItem('password')
        },
        body: JSON.stringify({ name, email, password, weight, height })
    })
    .then(response => {
        if (!response.ok) {
            alert("Error al actualizar el usuario");
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (!data) return;
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('password', password);
        alert("¡Cambios guardados correctamente!");
        init();
    })
    .catch(err => console.error("Error al guardar cambios:", err));
}

//Eliminar usuario
function confirmDelete() {
    let modalEdit = bootstrap.Modal.getInstance(document.getElementById('modalEdit'));
    if (modalEdit) modalEdit.hide();

    let modalDelete = new bootstrap.Modal(document.getElementById('modalDeleteUser'));
    modalDelete.show();
}

function deleteUser() {
    let user = JSON.parse(sessionStorage.getItem('user'));

    fetch(`/users/${user.id}`, {
        method: 'DELETE',
        headers: {
            'x-auth': sessionStorage.getItem('password')
        }
    })
    .then(response => {
        if (!response.ok) {
            alert("Error al eliminar el usuario");
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (!data) return;
        sessionStorage.clear();
        window.location.href = local_url;
    })
    .catch(err => console.error("Error al eliminar usuario:", err));
}


//Datos Settings
function populateSettings() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    const nameInput     = document.querySelector('.name-input');
    const emailInput    = document.querySelector('input[type="email"]');
    const passwordInput = document.getElementById('passwordInput');
    const weightInput   = document.getElementById('weightInput');
    const heightInput   = document.getElementById('heightInput');

    if (nameInput)     nameInput.value     = user.name;
    if (emailInput)    emailInput.value    = user.email;
    if (passwordInput) passwordInput.value = sessionStorage.getItem('password');
    if (weightInput)   weightInput.value   = user.weight  || '';
    if (heightInput)   heightInput.value   = user.height  || '';
}

if (document.getElementById('passwordInput')) {
    populateSettings();
}

// Mostrar/ocultar contraseña
function togglePassword() {
    const input = document.getElementById('passwordInput');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function init() {
    if (document.getElementById('userNameWidget')) {
        let user = JSON.parse(sessionStorage.getItem('user'));
        document.getElementById('userNameWidget').innerText = user.name;
    }
}

//Listeners 
if (document.getElementById('formLogin')) {
    document.getElementById('formLogin').addEventListener('submit', login);
}
if (document.getElementById('formRegister')) {
    document.getElementById('formRegister').addEventListener('submit', register);
}
if (document.getElementById('modalEdit')) {
    document.getElementById('modalEdit').addEventListener('show.bs.modal', populateModal);
}
if (document.getElementById('btnLogout')) {
    document.getElementById('btnLogout').addEventListener('click', logout);
}
if (document.getElementById('btnConfirmDelete')) {
    document.getElementById('btnConfirmDelete').addEventListener('click', deleteUser);
}