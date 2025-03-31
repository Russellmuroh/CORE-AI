import axios from "axios";

const translateCommand = async (m, Matrix) => {
    const args = m.body.trim().split(/\s+/);
    
    if (args[0].toLowerCase() !== "translate" || args.length < 3) {
        return;
    }

    const lang = args[1];
    const text = args.slice(2).join(" ");
    
    try {
        const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`);
        
        if (!res.data.responseData.translatedText) throw new Error("Invalid API response");

        await Matrix.sendMessage(m.from, { 
            text: `🌍 *Translated Text:*\n\n_${text}_ → *${lang.toUpperCase()}*\n\n➜ ${res.data.responseData.translatedText}` 
        }, { quoted: m });

    } catch (error) {
        console.error("Translation Error:", error.message || error);
        await Matrix.sendMessage(m.from, { text: "❌ Failed to translate. Please check the language code and try again!" }, { quoted: m });
    }
};

export default translateCommand;
