import config from '../../config.cjs'; // Make sure this path is correct
import fetch from 'node-fetch';

const pair = async (m, sock) => {
    const triggerWord = "pair";
    const body = m.body.trim().toLowerCase();

    if (body.startsWith(triggerWord)) {
        const text = m.body.slice(triggerWord.length).trim();

        if (!text) {
            return await sock.sendMessage(
                m.from,
                { text: "❌ *Invalid Format!*\n\n✅ *Example:* `pair +2547*****`" },
                { quoted: m }
            );
        }

        try {
            const apiUrl = `https://cloud-tech-tces.onrender.com/pair?num=${text}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data.success) {
                return await sock.sendMessage(
                    m.from,
                    { text: "❌ *Failed to retrieve pairing code!*\n\n📌 *Check your number and try again.*" },
                    { quoted: m }
                );
            }

            const pairingCode = data.pairing_code;

            // Countdown like a movie scene
            for (let i = 5; i >= 1; i--) {
                await sock.sendMessage(m.from, { text: `⌛ Loading pairing code in... *${i}*` }, { quoted: m });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Final reveal
            await sock.sendMessage(
                m.from,
                { text: `✅ *Your CLOUD AI Pairing Code:*\n\n*${pairingCode}*` },
                { quoted: m }
            );

        } catch (error) {
            console.error(error);
            await sock.sendMessage(
                m.from,
                { text: "⚠️ *An error occurred!*\n\nPlease try again later." },
                { quoted: m }
            );
        }
    }
};

export default pair;
