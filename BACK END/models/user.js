const fs=require('fs');
const path = require('path');
let users = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/users.json'), 'utf8')
);

function getNextUserID(){
    return users.length + 1;
}

function emailDuplicado(email) {
    return users.some(user => user.email === email);
}

function contraseñaDuplicada(password) {
    return users.some(user => user.contraseña === password);
}

class UserException{
    constructor(errorMessage){
        this.errorMessage=errorMessage;
    }
}

class User{
    #id;
    #name;
    #email;
    #contraseña;
    #joined_at;

    constructor(name, email, contraseña){
        if (emailDuplicado(email)) {
            throw new UserException("El email ya está registrado. Por favor, usa otro email.");
        }
        
        if (contraseñaDuplicada(contraseña)) {
            throw new UserException("La contraseña ya está en uso. Por favor, elige otra contraseña.");
        }

        this.#id=getNextUserID();
        this.name=name;
        this.email=email;
        this.contraseña=contraseña;
        this.#joined_at=new Date();
    }

    //getters
    get id() {return this.#id;}
    get name() {return this.#name;}
    get email() {return this.#email;}
    get contraseña() {return this.#contraseña;}
    get joined_at() {return this.#joined_at;}

    //setters
    set id(value) {
        throw new UserException("Ups, ID no puede ser modificado.");
    }

    set name(value) {
        if (!value || value.trim() === "") {
            throw new UserException("El nombre no puede estar vacío.");
        }
        this.#name = value;
    }

    set email(value) {
        if (!value || value.trim() === "") {
            throw new UserException("El email no puede estar vacío.");
        }
        this.#email = value;
    }

    set contraseña(value){
        if (!value || value.trim() === "") {
            throw new UserException("La contraseña no puede estar vacía.");
        }
        if(value.length<8){
            throw new UserException("Tu contraseña debe ser de 8 o más dígitos. Intenta de nuevo.")
        }
        this.#contraseña=value;
    }

    set joined_at(value){
        throw new UserException("joined_at no puede ser modificado.");
    }

    toObject() {
        return {
            id: this.#id,
            name: this.#name,
            email: this.#email,
            contraseña: this.#contraseña,
            joined_at: this.#joined_at
        };
    }
}

module.exports=User;