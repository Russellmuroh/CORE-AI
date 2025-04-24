import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import config from '../config.cjs';
import axios from 'axios';

const getUserStats = async (user) => {
    return {
        menuCount: 5,
    };
};

const menu = async (m, Matrix) => {
    const cmd = m.body.toLowerCase().trim();
    if (cmd !== 'menu') return;

    const currentTime = moment().format('HH');
    let greeting = "Good Day";
    if (currentTime < 12) greeting = "Good Morning";
    else if (currentTime < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    const lastUpdated = moment().format('LLLL');
    const userStats = await getUserStats(m.sender);

    const mainMenu = `
✨ *Welcome to CLOUD AI, ${m.pushName}!* ✨

🖐️ ${greeting}, ${m.pushName}! 
🎉 *Bot is ready to assist you!*

🕒 *Last Updated*: ${lastUpdated}  
💻 *User Stats*: You've used this bot *${userStats.menuCount}* times today!

🎯 *Choose an option below to proceed:*

📥 *1.* *DOWNLOAD MENU*  
📱 *2.* *CONVERTER MENU*  
🤖 *3.* *AI MENU*  
🛠️ *4.* *TOOLS MENU*  
👥 *5.* *GROUP MENU*  
🔍 *6.* *SEARCH MENU*  
🏠 *7.* *MAIN MENU*  
🧑‍💻 *8.* *OWNER MENU*  
🕵️‍♂️ *9.* *STALK MENU*  
🎨 *10.* *LOGO MENU*

✏️ *Please reply with a number (1–10) to open the submenu of your choice.*
`;

    const menuImageUrl = 'https://files.catbox.moe/7jt69h.jpg';

    await Matrix.sendMessage(m.from, {
        image: { url: menuImageUrl },
        caption: mainMenu,
        contextInfo: { mentionedJid: [m.sender] }
    }, { quoted: m });

    const menus = {
        "1": `
🔽 *DOWNLOAD MENU* 🔽
📱 *apk* - Download APK files  
🎵 *play* - Download songs  
🎥 *video* - Download videos  
🎶 *song* - Download your favorite music  
📥 *mediafire* - Download from Mediafire  
📸 *pinterestdl* - Pinterest image download  
📷 *insta* - Instagram media download  
🎧 *ytmp3* - Download YouTube MP3  
📹 *ytmp4* - Download YouTube MP4
`,
        "2": `
🔽 *CONVERTER MENU* 🔽
💬 *attp* - Text to Audio  
🔢 *ebinary* - Encode to Binary  
🔢 *dbinary* - Decode Binary  
😎 *emojimix* - Create Emoji Mix  
🎵 *mp3* - Convert to MP3  
🔗 *url* - URL Shortener
`,
        "3": `
🔽 *AI MENU* 🔽
🧠 *ai* - Access AI Features  
🤖 *sheng on/off* - Toggle Sheng Language  
📜 *report* - Send a Report  
💬 *deepseek on/off* - Toggle GPT Mode  
🎨 *dalle* - DALL·E Image Generation  
🧠 *gemini* - Use Gemini AI  
📖 *define* - Define a word or term  
`,
        "4": `
🔽 *TOOLS MENU* 🔽
🧮 *calculator* - Simple Calculator  
📧 *tempmail* - Temporary Email Service  
📬 *checkmail* - Check Mail Inbox  
🔢 *elements* - Element Info Lookup  
🎙️ *tts* - Text to Speech  
📝 *emojimix* - Mix Emojis  
🌐 *shorten* - URL Shortener  
💾 *save* - Save Content for Later
`,
        "5": `
🔽 *GROUP MENU* 🔽
📋 *groupinfo* - Get Group Information  
🚫 *hidetag* - Hide Group Tag  
👥 *tagall* - Tag All Members  
📜 *setdesc* - Set Group Description  
🔒 *open* - Open Group  
🔒 *close* - Close Group  
➕ *add* - Add New Members  
❌ *kick* - Kick Members from Group  
🔗 *antilink on/off* - Anti-link Protection  
🚫 *antibot on/off* - Anti-bot Protection  
🔗 *grouplink* - Get Group Link  
👥 *invite* - Invite Members  
⬆️ *promote* - Promote Member to Admin  
🗳️ *poll* - Create a Poll  
📱 *vcf* - Share Contact in VCF format
`,
        "6": `
🔽 *SEARCH MENU* 🔽
🎵 *play* - Search Songs  
🔍 *yts* - Search YouTube  
🎬 *imdb* - Search Movies on IMDb  
🌐 *google* - Search Google  
📌 *pinterest* - Pinterest Search  
🖼️ *wallpaper* - Get Wallpapers  
📚 *wikimedia* - Search Wikimedia  
🎤 *lyrics* - Search Song Lyrics  
📖 *bible* - Search Bible Verses  
📖 *biblebooks* - List Bible Books
`,
        "7": `
🔽 *MAIN MENU* 🔽
🏓 *ping* - Ping the Bot  
⚡ *alive* - Check if Bot is Alive  
👨‍💻 *owner* - Owner Details  
📝 *menu* - Show this Menu Again  
💬 *about* - About the Bot  
🔗 *repo* - Get Bot Repository Links
`,
        "8": `
🔽 *OWNER MENU* 🔽
🚪 *join* - Join Group  
👋 *leave* - Leave Group  
🚫 *block* - Block a User  
🔓 *unblock* - Unblock a User  
🖼️ *setppbot* - Set Profile Picture  
📞 *anticall* - Anti Call Feature  
🔄 *alwaysonline* - Always Online Status  
👀 *autoread* - Auto Read Messages  
⏱️ *autotyping* - Auto Typing Status  
📶 *autorecording* - Auto Recording Status  
🔄 *autoreact* - Auto React Status  
🔁 *autobio* - Auto Bio Updates  
🔒 *autoread* - Auto Read Messages  
📱 *alwaysonline* - Always Online Mode  
📧 *view* - View Once Message  
🧹 *del* - Delete Messages  
🔄 *antidele on/off* - antidelete prompt 
`,
        "9": `
🔽 *STALK MENU* 🔽
📞 *truecaller* - Lookup Truecaller Info  
📷 *instastalk* - Instagram Stalk  
💻 *githubstalk* - GitHub User Stalk  
`,
        "10": `
🔽 *LOGO MENU* 🔽
🖼️ *logo* - Create a Logo  
🎮 *hacker* - Hacker Style Logo  
💖 *blackpink* - Blackpink Style Logo  
💎 *glossysilver* - Glossy Silver Logo  
🌀 *naruto* - Naruto Style Logo  
🔥 *digitalglitch* - Digital Glitch Effect  
🎮 *pixelglitch* - Pixel Glitch Effect  
⭐ *star* - Starry Logo Effect  
🌫️ *smoke* - Smoke Effect  
🐻 *bear* - Bear Style Logo  
⚡ *neondevil* - Neon Devil Style Logo  
📺 *screen* - Screen Effect  
🌍 *nature* - Nature Style Logo  
🐉 *dragonball* - Dragon Ball Style Logo  
❄️ *frozenchristmas* - Frozen Christmas Logo  
🎈 *foilballoon* - Foil Balloon Effect  
🎨 *colorfulpaint* - Colorful Paint Effect  
🇺🇸 *americanflag* - American Flag Logo  
💦 *water* - Water Effect  
🌊 *underwater* - Underwater Effect  
🔥 *dragonfire* - Dragon Fire Logo  
💧 *bokeh* - Bokeh Style Logo  
❄️ *snow* - Snowy Effect  
🏖️ *sand3D* - Sand 3D Effect  
🎮 *pubg* - PUBG Style Logo  
😱 *horror* - Horror Style Logo  
🩸 *blood* - Blood Effect Logo  
💡 *bulb* - Bulb Effect  
🎨 *graffiti* - Graffiti Effect  
⚡ *thunder* - Thunder Effect  
🌩️ *thunder1* - Thunder Strike Effect  
❤️ *womensday* - Women's Day Logo  
💘 *valentine* - Valentine Logo  
🎨 *graffiti2* - Graffiti 2 Logo  
👑 *queencard* - Queen Card Logo  
🌌 *galaxy* - Galaxy Style Logo  
🔥 *pentakill* - Pentakill Logo  
🎂 *birthdayflower* - Birthday Flower Logo  
♈ *zodiac* - Zodiac Style Logo  
💧 *water3D* - 3D Water Effect  
💡 *textlight* - Light Effect  
🧱 *wall* - Wall Style Logo  
💰 *gold* - Gold Style Logo  
✨ *glow* - Glow Effect
`
    };

    if (menus[cmd]) {
        Matrix.sendMessage(m.from, {
            text: menus[cmd],
            contextInfo: { mentionedJid: [m.sender] }
        });
    }
};

export default menu;
