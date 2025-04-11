import axios from 'axios';

let gptMode = false; // Tracks whether GPT mode is active or not

const gptCommandHandler = async (m, { conn, text }) => {
  // Toggle the GPT mode
  if (text.toLowerCase() === 'gpt1 on') {
    gptMode = true;
    return m.reply('GPT mode is now ON! I will respond with both text and voice.');
  } else if (text.toLowerCase() === 'gpt1 off') {
    gptMode = false;
    return m.reply('GPT mode is now OFF! I will no longer respond with voice.');
  }

  // If GPT mode is on, process the message
  if (gptMode) {
    try {
      const responseText = await fetchGPT3Response(m.body);
      await m.reply(responseText); // Send the text response

      const audioBuffer = await fetchTTSAudio(responseText);
      await conn.sendMessage(m.chat, audioBuffer, 'audio', { mimetype: 'audio/mp4', ptt: true }); // Send the voice response

      await m.react('✅'); // Mark message as processed
    } catch (error) {
      console.error('Error with GPT or TTS:', error);
      await m.reply('Sorry, something went wrong while generating the response.');
      await m.react('❌');
    }
  }
};

// Function to fetch GPT-3 response
const fetchGPT3Response = async (message) => {
  const apiUrl = `https://api.siputzx.my.id/api/ai/gpt3?prompt=kamu%20adalah%20ai%20yang%20ceria&content=${encodeURIComponent(message)}`;
  try {
    const response = await axios.get(apiUrl);
    return response.data.response || 'Sorry, I couldn\'t understand that.';
  } catch (error) {
    console.error('Error fetching GPT response:', error);
    return 'Sorry, I couldn\'t fetch a response from GPT.';
  }
};

// Function to fetch TTS audio for the response
const fetchTTSAudio = async (text) => {
  const apiUrl = `https://api.siputzx.my.id/api/tools/tts?text=${encodeURIComponent(text)}&voice=jv-ID-DimasNeural&rate=0%&pitch=0Hz&volume=0%`;
  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data); // Return audio buffer
  } catch (error) {
    console.error('Error fetching TTS audio:', error);
    throw new Error('Failed to generate voice response.');
  }
};

// Export the command handler
export default gptCommandHandler;
