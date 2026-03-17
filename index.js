const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');


// ===== CLIENTE =========
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/data/session' // 🔥 aquí se guarda todo
    })
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });

    console.log("SI EL QR DE ARRIBA SE VE MAL, ESCANEA ESTE:");
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
    console.log('✅ Miku quiere cantar!');
});

client.on('message', message => {
    if (message.body === 'hola') {
        message.reply('🎤 ¡Hola! Soy Miku~ ✨');
    }
});

client.initialize();
