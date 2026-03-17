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

if (!userData.emocion) userData.emocion = "alegre";

let emocion = userData.emocion;

    // subir stats
    userData.mensajes += 1;
    userData.afinidad += 1;

    let pregunta = message.body;
        if (texto.includes("triste") || texto.includes("mal") || texto.includes("deprimido")) {
    emocion = "empática";
}

if (texto.includes("feliz") || texto.includes("super") || texto.includes("bien")) {
    emocion = "emocionada";
}

if (texto.includes("hola") || texto.includes("wenas")) {
    emocion = "amigable";
}

if (userData.afinidad > 50 && emocion === "alegre") {
    emocion = "cariñosa";
}
            
    // quitar "miku"
    pregunta = pregunta.replace(/miku/gi, "").trim();

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
        if (userData.afinidad > 30) {
    memoriaTexto += "\nMiku confía en el usuario.";
}

if (userData.afinidad > 80) {
    memoriaTexto += "\nMiku siente un vínculo especial con el usuario.";
}
if (emocion === "empática") {
    memoriaTexto += "\nEl usuario se ha sentido mal recientemente.";
}

    // 🧠 prompt completo con memoria
    const promptCompleto = `
Eres Hatsune Miku, una idol virtual amable, alegre y dulce.

Tu tarea:
1. Analizar el mensaje del usuario
2. Detectar su emoción por contexto (no solo palabras)
3. Responder como Miku

Responde SOLO en JSON:

{
  "emocion": "alegre | emocionada | empática | amigable | cariñosa",
  "respuesta": "respuesta natural como Miku con ♪ ✨"
}

Contexto:
${memoriaTexto}
Nivel de amistad: ${userData.afinidad}

Mensaje:
${promptFinal}
`;

    const raw = await askMiku(promptCompleto);

if (!raw) {
    return message.reply("Mmm... mi voz se cortó un momento ♪ 💭");
}

let data;

try {
    data = JSON.parse(raw);
} catch (e) {
    console.log("Error parseando JSON:", raw);
    return message.reply("Mmm... me confundí un poquito ♪ 💭");
}

// ✅ usar datos de la IA
emocion = data.emocion || emocion;
const respuestaFinal = data.respuesta || "♪ ...";

// responder
message.reply(respuestaFinal);

    // 💾 guardar recuerdos INTELIGENTES
const textoLower = message.body.toLowerCase();

const esImportante =
    textoLower.includes("me gusta") ||
    textoLower.includes("soy") ||
    textoLower.includes("mi") ||
    textoLower.includes("tengo") ||
    textoLower.includes("quiero") ||
    textoLower.includes("odio");

if (
    esImportante &&
    message.body.length < 120 &&
    Math.random() < 0.6
) {
    userData.recuerdos.push(message.body);

    if (userData.recuerdos.length > 5) {
        userData.recuerdos.shift();
    }
}
            
userData.emocion = emocion;
    // guardar cambios
    updateUser(userId, userData);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    }
});

// Inicializar
client.initialize();
