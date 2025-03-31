import config from '../config.cjs';
import fetch from 'node-fetch';

const bibleCommand = async (m, Matrix) => {
  // Get the entire message text, trimmed and in lowercase for comparison
  const text = m.body.trim();
  const lowerText = text.toLowerCase();

  // Check if the message starts with "bible"
  if (!lowerText.startsWith("bible")) return;

  // Remove the command word "bible" to get the reference
  const reference = text.slice(5).trim(); // "bible" is 5 characters

  if (!reference) {
    return m.reply('⚠️ Please specify the book, chapter, and verse. Example: *bible john 3:16*');
  }


  
  try {
    // Encode the reference for the API call
    const encodedReference = encodeURIComponent(reference);

    // Fetch Bible data from the API
    const response = await fetch(`https://bible-api.com/${encodedReference}`);
    const data = await response.json();

    // Check if the data is valid
    if (!data || !data.reference) {
      return m.reply('⚠️ Invalid reference. Example: *bible john 3:16*.');
    }

    // Extract Bible verse information
    const verses = data.verses ? data.verses.length : 1;
    const contentText = data.text;
    const language = data.translation_name;

    // Create the response message
    const message = `📖 *BERA TECH BIBLE*\n\n🔹 *We are reading:* ${data.reference}\n🔹 *Number of verses:* ${verses}\n\n📜 *Now Read:*\n${contentText}\n\n🌍 *Translation:* ${language}`;

    // Send the response message
    await Matrix.sendMessage(m.from, { text: message }, { quoted: m });

  } catch (error) {
    console.error("Error occurred:", error);
    m.reply('❌ An error occurred while fetching the Bible verse. Please try again later.');
  }
};

export default bibleCommand;
