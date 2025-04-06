import fetch from 'node-fetch';

const pair = async (m, sock) => {
    const text = m.body.trim();

    if (text.toLowerCase().startsWith('pair')) {
        const phoneNumber = text.slice(4).trim(); // Extract the phone number after 'pair'

        if (!phoneNumber) {
            return await sock.sendMessage(
                m.from,
                { text: "❌ *Invalid Format!*\n\n✅ *Example:* `pair +1234567890`" },
                { quoted: m }
            );
        }

        try {
            const apiUrl = `https://cloud-tech-tces.onrender.com/pair?num=${phoneNumber}`;
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

            // React with loading and success icons
            await m.React('⏳'); 
            await new Promise(resolve => setTimeout(resolve, 2000));
            await m.React('✅');

            // Send response
            const responseText = `✅ *Your CLOUD AI Pairing Code:*\n\n*${pairingCode}*`;

            await sock.sendMessage(
                m.from,
                { text: responseText },
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
