const fs = require('fs');

const path = '/data/memory.json';

function cargarMemoria() {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(path));
}

function guardarMemoria(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function getUser(userId) {
    const data = cargarMemoria();

    if (!data[userId]) {
        data[userId] = {
            mensajes: 0,
            afinidad: 0,
            recuerdos: [],
emocion: "alegre"
        };
    }

    return data[userId];
}

function updateUser(userId, userData) {
    const data = cargarMemoria();
    data[userId] = userData;
    guardarMemoria(data);
}

module.exports = { getUser, updateUser };
