import axios from 'axios';
import config from '../config.cjs';

const apiBaseUrl = 'https://cloud-tech-tces.onrender.com/pair'; // Your API endpoint

const getPairingCode = async (m, Matrix) => {
  if (m.sender !== config.OWNER_NUMBER) return;

  const body = m.body.toLowerCase();
  const validCommands = ['pair', 'getsession', 'paircode', 'pairingcode'];

  const foundCmd = validCommands.find(cmd => body.startsWith(cmd));
  if (!foundCmd) return;

  const text = body.slice(foundCmd.length).trim();

  if (!text) return m.reply('Please provide a phone number with country code.');

  const phoneNumberMatch = text.match(/^(\+\d{1,3})(\d+)$/);
  if (!phoneNumberMatch) return m.reply('Please provide a valid phone number with country code.');

  const countryCode = phoneNumberMatch[1];
  const phoneNumber = phoneNumberMatch[2];

  try {
    await m.React('🕘');

    const response = await axios.post(apiBaseUrl, {
      phoneNumber: countryCode + phoneNumber
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;

    if (result.pairingCode) {
      const message = `Pairing Code: ${result.pairingCode}\nStatus: ${result.status}`;
      await m.reply(message);
      await m.React('✅');
    } else {
      throw new Error('Invalid response from the server.');
    }
  } catch (error) {
    console.error('Error fetching pairing code:', error.message);
    await m.reply('Error fetching pairing code.');
    await m.React('❌');
  }
};

export default getPairingCode;
