import fetch from 'node-fetch'

const LyricsDownloader = async (m, conn) => {
  const body = m.body?.toLowerCase()
  if (!['lyrics', 'lyric'].some(x => body.startsWith(x)) || !m.key.fromMe) return

  const query = body.replace(/^(lyrics|lyric)/i, '').trim()
  if (!query) return m.reply('✳️ *Please provide a song title.*\n\n📌 Example: `lyrics Faded`')

  await m.react('🎵')

  try {
    // Fetch lyrics
    const res = await fetch(`https://api.dreaded.site/api/lyrics?title=${encodeURIComponent(query)}`)
    const json = await res.json()

    if (!json || !json.lyrics) {
      await m.react('❌')
      return m.reply(`❌ *No lyrics found for:* ${query}`)
    }

    // Download music
    const ytRes = await fetch(`https://apis.davidcyriltech.my.id/download/ytmp3?url=https://youtube.com/results?search_query=${encodeURIComponent(query)}`)
    const ytData = await ytRes.json()
    const audioUrl = ytData?.result?.url_audio

    const caption = `🎧 *Lyrics for:* ${json.title || query}\n\n${json.lyrics.slice(0, 4000)}`
    await m.reply(caption)

    if (audioUrl) {
      await conn.sendMessage(m.chat, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${json.title || query}.mp3`,
      }, { quoted: m })
    } else {
      await m.reply('⚠️ Audio not found or failed to fetch.')
    }

    await m.react('✅')

  } catch (err) {
    console.error(err)
    await m.react('❌')
    await m.reply('❌ *An error occurred while fetching lyrics or music.*')
  }
}

export default LyricsDownloader
