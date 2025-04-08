import fetch from 'node-fetch';

export const elementInfo = async (m, sock) => {
  if (!m.text) {
    await sock.sendMessage(m.from, { text: "Please provide an element name or symbol." });
    return;
  }

  const elementNameOrSymbol = m.text.trim().toLowerCase();
  
  const apiUrl = `https://api.popcat.xyz/periodic-table?element=${elementNameOrSymbol}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      await sock.sendMessage(m.from, { text: `Hmm, I couldn't find anything for "${elementNameOrSymbol}". Did you mean "Hydrogen"? 🤔` });
      return;
    }

    const element = data[elementNameOrSymbol] || null;

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

      await sock.sendMessage(m.from, { text: elementInfoText });
      await sock.sendMessage(m.from, { image: { url: image }, caption: `${name} - ${symbol}` });
    } else {
      await sock.sendMessage(m.from, { text: `No information found for the element "${elementNameOrSymbol}". Try again.` });
    }

  } catch (error) {
    console.error(error);
    await sock.sendMessage(m.from, { text: "Something went wrong while fetching element data. Please try again later." });
  }
};
