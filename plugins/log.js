import axios from 'axios';
import config from '../../config.cjs';

const LogoCmd = async (message, bot) => {
  const userName = message.pushName || "User";
  const text = message.body.trim().toLowerCase(); // Convert message text to lowercase

  const sendMessage = async (text) => {
    await bot.sendMessage(message.from, { text }, { quoted: message });
  };

  // Logo styles API list
  const logoStyles = {
    blackpink: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/online-blackpink-style-logo-maker-effect-711.html&name=",
    glossysilver: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-glossy-silver-3d-text-effect-online-802.html&name=",
    Naruto: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html&name=",
    digitalglitch: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html&name=",
    pixelglitch: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-pixel-glitch-text-effect-online-769.html&name=",
    water: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-water-effect-text-online-295.html&name=", 
    bulb: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/text-effects-incandescent-bulbs-219.html&name=", 
    zodiac: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/free-zodiac-online-logo-maker-491.html&name=", 
    water3D: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/water-3d-text-effect-online-126.html&name=", 
    dragonfire: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/dragon-fire-text-effect-111.html&name=", 
    bokeh: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/bokeh-text-effect-86.html&name=", 
    Queencard: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-a-personalized-queen-card-avatar-730.html&name=", 
    birthdaycake: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/birthday-cake-96.html&name=", 
    underwater: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/3d-underwater-text-effect-online-682.html&name=", 
    glow: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/advanced-glow-effects-74.html&name=", 
    wetglass: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/write-text-on-wet-glass-online-589.html&name=", 
    graffiti: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/graffiti-color-199.html&name=", 
    halloween: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/cards-halloween-online-81.html&name=", 
    tattootattoo: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/make-tattoos-online-by-your-name-309.html&name=", 
    luxury: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/free-luxury-logo-maker-create-logo-online-458.html&name=", 
    avatar: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-avatar-gold-online-303.html&name=", 
    blood: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/write-blood-text-on-the-wall-264.html&name=", 
    hacker: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html&name=", 
    paint: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html&name=", 
    rotation: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-elegant-rotation-logo-online-586.html&name=", 
    graffiti2: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-a-cartoon-style-graffiti-text-effect-online-668.html&name=", 
    typography: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-online-typography-art-effects-with-multiple-layers-811.html&name=", 
    horror: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/writing-horror-letters-on-metal-plates-265.html=", 
    valentine: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/beautiful-flower-valentine-s-day-greeting-cards-online-512.html&name=", 
    team: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-logo-team-logo-gaming-assassin-style-574.html&name=", 
    gold: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/modern-gold-3-212.html&name=", 
    pentakill: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-a-lol-pentakill-231.html&name=", 
    galaxy: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/galaxy-text-effect-new-258.html&name=", 
    birthdayflower: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/write-name-on-flower-birthday-cake-pics-472.html&name=", 
    pubg: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/pubg-mascot-logo-maker-for-an-esports-team-612.html&name=", 
    sand3D: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/realistic-3d-sand-text-effect-online-580.html&name=", 
    wall: "https://api-pink-venom.vercel.app/api/logo?url=https://textpro.me/break-wall-text-effect-871.html", 
    womensday: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/create-beautiful-international-women-s-day-cards-399.html&name=", 
    thunder1: "https://api-pink-venom.vercel.app/api/logo?url=https://textpro.me/online-thunder-text-effect-generator-1031.html&name=", 
    snow: "https://api-pink-venom.vercel.app/api/logo?url=https://textpro.me/create-beautiful-3d-snow-text-effect-online-1101.html&name=", 
    thunder: "https://api-pink-venom.vercel.app/api/logo?url=https://textpro.me/online-thunder-text-effect-generator-1031.html&name=", 
    textlight: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/text-light-effets-234.html&name=", 
    sand: "https://api-pink-venom.vercel.app/api/logo?url=https://en.ephoto360.com/write-in-sand-summer-beach-online-576.html&name="
  };

  const [logoType, ...userTextArray] = text.split(" ");
  const userInput = userTextArray.join(" ").trim();

  if (logoStyles[logoType]) {
    if (!userInput) {
      await sendMessage("⚠️ Please provide text to generate a logo!");
      return;
    }

    try {
      await bot.sendMessage(message.from, { react: { text: '⏳', key: message.key } });

      const apiUrl = logoStyles[logoType] + encodeURIComponent(userInput);
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.status && data.result && data.result.download_url) {
        const imageUrl = data.result.download_url;
        await bot.sendMessage(message.from, { image: { url: imageUrl }, caption: "Here is your logo!" }, { quoted: message });

        await bot.sendMessage(message.from, { react: { text: '✅', key: message.key } });
      } else {
        await sendMessage("⚠️ Failed to generate the logo. Please try again later!");
      }
    } catch (error) {
      console.error(error);
      await sendMessage("⚠️ An error occurred while generating the logo. Please try again later!");
    }
  }
};

export default LogoCmd;
