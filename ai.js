const fetch = require("node-fetch");
const personality = require("./personality");

async function askMiku(message) {
    try {
        // 1. Cambiamos la URL a la de Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // Aquí irá tu key de Groq
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // 2. Cambiamos el modelo a uno de Groq (llama-3.3-70b es muy bueno)
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: personality },
                    { role: "user", content: message }
                ],
                temperature: 0.9
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("❌ Error de API:", data.error.message);
            return null;
        }

        return data.choices[0].message.content;

    } catch (err) {
        console.error("❌ Error en askMiku:", err.message);
        return null;
    }
}

module.exports = askMiku;
