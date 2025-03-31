import config from '../config.cjs';
import fetch from 'node-fetch';

const dictionaryCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  // If you're using a prefix, adjust accordingly. Otherwise, you can remove prefix handling.
  const cmdWithPrefix = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : m.body.split(' ')[0].toLowerCase();
  const text = m.body.slice((m.body.startsWith(prefix) ? prefix.length : 0) + cmdWithPrefix.length).trim();

  // Valid trigger words
  const validCommands = ['define', 'meaning', 'dictionary'];

  if (validCommands.includes(cmdWithPrefix)) {
    try {
      if (!text) {
        return m.reply("⚠️ Please provide a word to define. Example: *define apple*");
      }

      const word = encodeURIComponent(text);
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

      if (!response.ok) {
        return m.reply("⚠️ Failed to fetch data. Please try again later.");
      }

      const data = await response.json();

      if (!data || !data[0] || !data[0].meanings || data[0].meanings.length === 0) {
        return m.reply("❌ No definitions found for the provided word.");
      }

      const definitionData = data[0];
      const definition = definitionData.meanings[0].definitions[0].definition;
      const example = definitionData.meanings[0].definitions[0].example || "No example available.";
      const synonyms = definitionData.meanings[0].definitions[0].synonyms?.join(", ") || "No synonyms available.";

      const message = `
📖 *Word:* ${definitionData.word}
📌 *Definition:* ${definition}
✍️ *Example:* ${example}
🔗 *Synonyms:* ${synonyms}

*🔹 REGARDS BRUCE BERA*`;

      await Matrix.sendMessage(m.from, { text: message }, { quoted: m });

    } catch (error) {
      console.error("Error occurred:", error);
      m.reply("❌ An error occurred while fetching the data. Please try again later.");
    }
  }
};

export default dictionaryCommand;
