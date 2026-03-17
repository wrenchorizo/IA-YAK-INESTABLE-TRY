const fetch = require("node-fetch");
const personality = require("./personality");

async function askMiku(message) {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: personality },
                    { role: "user", content: message }
                ],
                temperature: 0.9
            })
        });

        const data = await response.json();

        // 🔍 ESTO TE DIRÁ EL ERROR REAL EN LOS LOGS:
        if (data.error) {
            console.error("❌ Error de OpenAI:", data.error.message);
            return null;
        }

        if (!data.choices || !data.choices[0]) {
            console.log("⚠️ Respuesta vacía de la IA:", data);
            return null;
        }

        return data.choices[0].message.content;

    } catch (err) {
        console.error("❌ Error de conexión en askMiku:", err.message);
        return null;
    }
}

module.exports = askMiku;
