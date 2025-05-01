import fetch from 'node-fetch';

const pair = async (m, sock) => {
    try {
        const body = m.body?.toLowerCase().trim();
        
        // Check for trigger phrases
        const triggers = [
            'get pair code',
            'generate pair',
            'whatsapp pair',
            'get pairing code',
            'create session',
            'code'
        ];
        
        if (!triggers.some(trigger => body?.includes(trigger))) {
            return;
        }

        // Extract phone number from message
        const numberMatch = m.body.match(/(?:\+|00)?(?:\d\s?){10,15}/);
        if (!numberMatch) {
            return await sock.sendMessage(
                m.from,
                {
                    text: "📱 *Phone Number Required*\n\n" +
                          "🔢 Please include a valid phone number:\n\n" +
                          "• International format: `+1234567890`\n" +
                          "• Local format: `1234567890`\n\n" +
                          "💡 Example: `generate pair +1234567890`",
                    contextInfo: {
                        externalAdReply: {
                            title: "WhatsApp Pairing System",
                            body: "Need help? Type 'pair help'",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );
        }

        const phoneNumber = numberMatch[0].replace(/\s/g, '');
        await m.React('⏳'); // Loading reaction

        // Call the pairing API endpoint
        const apiUrl = `https://cloud-tech-tces.onrender.com/pair?number=${encodeURIComponent(phoneNumber)}`;
        const response = await fetch(apiUrl, {
            timeout: 10000 // 10 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`API responded with ${response.status}`);
        }
        
        const data = await response.json();

        if (!data?.success) {
            throw new Error(data?.message || 'Invalid API response');
        }

        // Format the response
        const responseText = 
            `✨ *New Session Created* ✨\n\n` +
            `📱 *For Number:* \`${phoneNumber}\`\n` +
            `🔐 *Pairing Code:* \`${data.pairing_code}\`\n` +
            `⏳ *Expires in:* ${data.expires_in || '5 minutes'}\n\n` +
            `📌 *Instructions:*\n` +
            `1. Open WhatsApp on your phone\n` +
            `2. Go to Settings → Linked Devices\n` +
            `3. Enter this code when prompted\n\n` +
            `⚠️ *Security Notice:* Never share this code!`;

        await sock.sendMessage(
            m.from,
            {
                text: responseText,
                contextInfo: {
                    externalAdReply: {
                        title: "WhatsApp Pairing System",
                        body: "Session created successfully",
                        thumbnailUrl: data.qr_code_url || '',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: m }
        );

        await m.React('✅'); // Success reaction

    } catch (error) {
        console.error("Pairing Error:", error);
        await m.React('❌');
        
        const errorMessage = 
            "⚠️ *Session Creation Failed*\n\n" +
            "🚫 Error: " + (error.message || 'Unknown error') + "\n\n" +
            "Possible solutions:\n" +
            "• Check the phone number format\n" +
            "• Ensure your number can receive WhatsApp\n" +
            "• Try again in 2 minutes";
            
        await sock.sendMessage(m.from, { text: errorMessage }, { quoted: m });
    }
};

export default pair;
