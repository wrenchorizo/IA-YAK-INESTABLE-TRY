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

        if (!data.choices || !data.choices[0]) {
            console.log("Error raro IA:", data);
            return null;
        }

        return data.choices[0].message.content;

    } catch (err) {
        console.log("Error en askMiku:", err);
        return null;
    }
}

module.exports = askMiku;
