import fetch from 'node-fetch';

export const elementInfo = async (m, sock) => {
  // Check if the message contains any of the trigger words (case insensitive)
  const triggerWords = ['ele', 'elements', 'element'];
  const messageText = m.text.trim().toLowerCase();

  // If message doesn't start with the trigger words, do nothing
  if (!triggerWords.some(word => messageText.startsWith(word))) {
    return;
  }

  // Remove the trigger word from the beginning of the message and trim any extra spaces
  const elementNameOrSymbol = messageText.replace(/^(ele|elements|element)\s+/i, '').trim();

  // If no element name or symbol is provided, ask the user to provide one
  if (!elementNameOrSymbol) {
    await sock.sendMessage(m.from, { text: "Please provide an element name or symbol." });
    return;
  }

  const apiUrl = `https://api.popcat.xyz/periodic-table?element=${elementNameOrSymbol}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      await sock.sendMessage(m.from, { text: `Hmm, I couldn't find anything for "${elementNameOrSymbol}". Did you mean "Hydrogen"? 🤔` });
      return;
    }

    // Ensure that the element exists in the API response
    const element = data[elementNameOrSymbol.toLowerCase()] || null;

    if (element) {
      const { name, symbol, atomic_number, atomic_mass, period, phase, discoverer, summary, image } = element;

      const elementInfoText = `
      *Name*: ${name}
      *Symbol*: ${symbol}
      *Atomic Number*: ${atomic_number}
      *Atomic Mass*: ${atomic_mass}
      *Period*: ${period}
      *Phase*: ${phase}
      *Discoverer*: ${discoverer}
      *Summary*: ${summary}
      `;

      // Send the element's detailed info
      await sock.sendMessage(m.from, { text: elementInfoText });

      // Send the element's image along with the text
      await sock.sendMessage(m.from, { image: { url: image }, caption: `${name} - ${symbol}` });
    } else {
      await sock.sendMessage(m.from, { text: `No information found for the element "${elementNameOrSymbol}". Try again.` });
    }

  } catch (error) {
    console.error(error);
    await sock.sendMessage(m.from, { text: "Something went wrong while fetching element data. Please try again later." });
  }
};
