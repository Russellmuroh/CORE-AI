import fetch from 'node-fetch';

const repo = async (m, Matrix) => {
    const text = m.body.trim().toLowerCase();
    if (text !== "repo") return; // Only triggers with "repo"

    const repoUrl = "https://github.com/DEVELOPER-BERA/CLOUD-AI";
    const apiUrl = "https://api.github.com/repos/DEVELOPER-BERA/CLOUD-AI";

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch repository data.");

        const repoData = await response.json();
        const stars = repoData.stargazers_count || 0;
        const forks = repoData.forks_count || 0;
        const owner = repoData.owner?.login || "Unknown";
        const lastUpdated = repoData.updated_at ? new Date(repoData.updated_at).toLocaleDateString() : "N/A";

        const message = {
            image: { url: "https://files.catbox.moe/e3t1zg.jpg" }, // Replace with your preferred image
            caption: `*Repository:* [CLOUD ☁️ AI](${repoUrl})  
⭐ *Stars:* ${stars}  
🍴 *Forks:* ${forks}  
👨‍💻 *Owner:* ${owner}  
📅 *Last Update:* ${lastUpdated}  

*Regards, Bruce Bera*`
        };

        await Matrix.sendMessage(m.from, message, { quoted: m });
    } catch (error) {
        console.error("Error fetching GitHub data:", error);
        await Matrix.sendMessage(m.from, { text: "⚠️ Failed to fetch repository details. Please try again later." }, { quoted: m });
    }
};

export default repo;
