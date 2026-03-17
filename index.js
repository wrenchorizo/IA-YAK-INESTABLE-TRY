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
        if (message.fromMe) return;

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

    const userId = message.from;
    let userData = getUser(userId);

    // subir stats
    userData.mensajes += 1;
    userData.afinidad += 1;

    let pregunta = texto;

    // quitar "miku"
    pregunta = pregunta.replace("miku", "").trim();

    if (!pregunta) {
        return message.reply("¿Me llamaste? ♪ ✨");
    }

    // 🧠 contexto de reply
    const promptFinal = contexto
        ? `Contexto: ${contexto}\nUsuario: ${pregunta}`
        : pregunta;

    // 🔥 AQUÍ VA EL PASO 3
let memoriaTexto = "";

if (!userData.recuerdos) userData.recuerdos = [];

if (userData.recuerdos.length > 0) {
    memoriaTexto = "Recuerdos del usuario: " + userData.recuerdos.join(", ");
}
    

    // 🧠 prompt completo con memoria
    const promptCompleto = `
Eres Hatsune Miku, una idol virtual amable, alegre y un poco juguetona. 
Hablas con emoción, usas "♪", "✨" y eres cariñosa con el usuario.

${memoriaTexto}
Nivel de amistad: ${userData.afinidad}

${promptFinal}
`;

    const respuesta = await askMiku(promptCompleto);

if (!respuesta) {
    return message.reply("Mmm... mi voz se cortó un momento ♪ 💭");
}

message.reply(respuesta);

    // 💾 guardar recuerdos (simple)
    if (
    message.body.length > 10 &&
    message.body.length < 100 &&
    Math.random() < 0.3
) {
        userData.recuerdos.push(message.body);

        if (userData.recuerdos.length > 5) {
            userData.recuerdos.shift();
        }
    }

    // guardar cambios
    updateUser(userId, userData);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    }
});

// Inicializar
client.initialize();
