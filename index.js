const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');


// ===== CLIENTE =========
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/data/session' // 🔥 aquí se guarda todo
    })
});

client.on('qr', (qr) => {
    console.log('Escanea este QR:');
    qrcode.generate(qr, { small: true });
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
