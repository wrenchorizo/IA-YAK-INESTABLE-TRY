const personality = require("./personality");

async function askMiku(message) {

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
    return data.choices[0].message.content;
}

module.exports = askMiku;
