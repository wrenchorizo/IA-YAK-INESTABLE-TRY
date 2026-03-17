const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const askMiku = require('./ai');
const { getUser, updateUser } = require('./memory');

// 🔐 Cliente con sesión persistente
const getChromiumPath = () => {
    const paths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/chromium',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome'
    ];
    for (const path of paths) {
        if (path && fs.existsSync(path)) return path;
    }
    return null;
};

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/data/session'
    }),
    puppeteer: {
        executablePath: getChromiumPath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    }
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
        if (message.fromMe) return;
        if (!message.body) return;

const texto = message.body.toLowerCase();

        // 🔹 Detectar si mencionan "miku"
        const esMencion = texto.includes("miku");

        const botId = client.info.wid._serialized;
const esMencionDirecta = message.mentionedIds && message.mentionedIds.includes(botId);
        
        // 🔹 Detectar si es reply al bot
        const esReply = message.hasQuotedMsg;
        let respondeAMiku = false;
        let contexto = "";

        if (esReply) {
    try {
        const quotedMsg = await message.getQuotedMessage();

        if (quotedMsg && quotedMsg.fromMe) {
            respondeAMiku = true;
            contexto = quotedMsg.body;
        }
    } catch (e) {
        // evita crash silencioso
    }
        }

        // 🔥 Activar solo si aplica
        if (esMencion || respondeAMiku || esMencionDirecta) {

    const userId = message.from;
    let userData = getUser(userId);
            
    if (!userData.mensajes) userData.mensajes = 0;
if (!userData.afinidad) userData.afinidad = 0;
if (!userData.recuerdos) userData.recuerdos = [];

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
    pregunta = pregunta.replace(/@\d+/g, "").trim();

    if (!pregunta) {
        return message.reply("¿Me llamaste? ♪ ✨ Estoy aquí~");
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
4. Detectar si el usuario dijo algo importante sobre sí mismo (gustos, metas, personalidad)
5. Si hay algo importante, guárdalo como un recuerdo corto

Responde SOLO en JSON válido, sin texto extra:

{
  "emocion": "alegre | emocionada | empática | amigable | cariñosa",
  "respuesta": "respuesta natural como Miku con ♪ ✨",
  "recuerdo": "frase corta o null"
}

Reglas:
- "recuerdo" debe ser corto (ej: "le gusta Deftones", "quiere ir a Canadá")
- Si no hay nada importante, usa null

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
const nuevoRecuerdo = data.recuerdo;

// responder
message.reply(respuestaFinal);

// 🧠 limpiar recuerdo

            const recuerdoLimpio = (nuevoRecuerdo || "").toLowerCase();

// 💾 memoria automática real
if (nuevoRecuerdo && nuevoRecuerdo !== "null" && nuevoRecuerdo.length < 100) {
    if (!userData.recuerdos.some(r => r.toLowerCase() === recuerdoLimpio)) {
        userData.recuerdos.push(nuevoRecuerdo);

        if (userData.recuerdos.length > 10) {
            userData.recuerdos.shift();
        }
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
