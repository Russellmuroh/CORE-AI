import fetch from 'node-fetch';
import config from '../../config.cjs';

const lyricsCommand = async (message, client) => {
    const userMessage = message.body.toLowerCase();
    if (!userMessage.startsWith('lyrics') && !userMessage.startsWith('lyric')) return;

    const songName = userMessage.replace(/^(lyrics|lyric)\s+/i, '').trim();
    if (!songName) {
        await client.sendMessage(message.from, { text: "Please provide a song name. Example: `lyrics Shape of You`" }, { quoted: message });
        return;
    }

    let lyricsText = '';
    try {
        // First API Attempt
        let response = await fetch(`https://some-lyrics-api.com/api/lyrics?song=${encodeURIComponent(songName)}`);
        if (!response.ok) throw new Error("Failed to fetch lyrics");

        let data = await response.json();
        if (!data.lyrics) throw new Error("Lyrics not found");

        lyricsText = data.lyrics;
    } catch (error) {
        // Backup API Attempt
        try {
            let backupResponse = await fetch(`https://backup-lyrics-api.com/api?song=${encodeURIComponent(songName)}`);
            if (!backupResponse.ok) throw new Error("Backup API failed");

            let backupData = await backupResponse.json();
            if (!backupData.lyrics) throw new Error("Lyrics not found in backup");

            lyricsText = backupData.lyrics;
        } catch (backupError) {
            await client.sendMessage(message.from, { text: "❌ Lyrics not found. Try another song!" }, { quoted: message });
            return;
        }
    }

    const formattedLyrics = `🎶 *Lyrics for* _${songName}_ 🎶\n\n${lyricsText}`;

    const buttonMessage = {
        text: formattedLyrics,
        footer: "Tap below to copy lyrics",
        buttons: [
            {
                buttonId: "copy_lyrics",
                buttonText: { displayText: "📋 Copy Lyrics" },
                type: 1
            }
        ],
        headerType: 1
    };

    await client.sendMessage(message.from, buttonMessage, { quoted: message });
};

export default lyricsCommand;
