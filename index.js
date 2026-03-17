const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const askMiku = require('./ai');
const { getUser, updateUser } = require('./memory');

// 🔐 Cliente con sesión persistente
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/data/session' // 🔥 guarda sesión en Railway
    })
});

// 📱 QR
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: false });

    console.log("\n📱 ESCANEA ESTE QR (link directo):\n");
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=20&data=${encodeURIComponent(qr)}`);
});

// ✅ Bot listo
client.on('ready', () => {
    console.log('🎤 Miku está lista par cantar!');
});

// 💬 Mensajes
client.on('message', async (message) => {
    try {
        const texto = message.body.toLowerCase();

        // 🔹 Detectar si mencionan "miku"
        const esMencion = texto.includes("miku");

        // 🔹 Detectar si es reply al bot
        const esReply = message.hasQuotedMsg;
        let respondeAMiku = false;
        let contexto = "";

        if (esReply) {
            const quotedMsg = await message.getQuotedMessage();

            if (quotedMsg.fromMe) {
                respondeAMiku = true;
                contexto = quotedMsg.body;
            }
        }

        // 🔥 Activar solo si aplica
        if (esMencion || respondeAMiku) {

            let pregunta = message.body;

            // quitar "miku" del mensaje
            pregunta = pregunta.replace(/miku/gi, "").trim();

            if (!pregunta) {
                return message.reply("¿Me llamaste? ♪ ✨");
            }

            // 🧠 Enviar contexto + pregunta
            const promptFinal = contexto
                ? `Contexto: ${contexto}\nUsuario: ${pregunta}`
                : pregunta;

            const respuesta = await askMiku(promptFinal);

            message.reply(respuesta);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    }
});

// Inicializar
client.initialize();
