const animeFinder = async (m, sock) => {
  const triggers = ['find anime', 'find manga'];
  const match = triggers.find(t => m.body?.toLowerCase().startsWith(t));
  
  if (match) {
    const query = m.body.slice(match.length).trim();
    const { data } = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}`);
    
    await sock.sendMessage(m.from, {
      image: { url: data.data[0].images.jpg.image_url },
      caption: `🎌 *${data.data[0].title}*\n⭐ ${data.data[0].score}\n📺 ${data.data[0].episodes} eps\n\n${data.data[0].synopsis.slice(0, 200)}...`
    }, { quoted: m });
  }
};
export default animeFinder;
