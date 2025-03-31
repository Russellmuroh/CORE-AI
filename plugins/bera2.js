import fetch from "node-fetch";
import config from "../config.cjs";

export const name = "update";
export const description = "Update bot to the latest version from GitHub and restart.";

export async function execute(m, { reply }) {
    try {
        // Check if Heroku API Key and App Name are set
        if (!config.HEROKU_API_KEY || !config.HEROKU_APP_NAME) {
            return reply("❌ *Heroku API Key or App Name is missing!*\n\nPlease set them in your environment variables.");
        }

        // Notify user that update is starting
        reply("🔄 *Updating bot to the latest version...*\nFetching latest updates from GitHub...");

        // Fetch latest commit from GitHub repo
        const repo = "DEVELOPER-BERA/CLOUD-AI";
        const githubApi = `https://api.github.com/repos/${repo}/commits/main`;
        const commitData = await fetch(githubApi).then(res => res.json());

        if (!commitData.sha) {
            return reply("⚠️ *Failed to fetch latest update!*\nPlease check if the GitHub repository exists.");
        }

        const latestCommit = commitData.sha;
        const commitMessage = commitData.commit.message;
        const commitUrl = commitData.html_url;

        // Notify about the latest commit
        reply(`✅ *Latest Commit Found!*\n\n📝 *Message:* ${commitMessage}\n🔗 [View Commit](${commitUrl})\n\n🚀 *Deploying update on Heroku...*`);

        // Trigger Heroku deployment
        const herokuApi = `https://api.heroku.com/apps/${config.HEROKU_APP_NAME}/builds`;
        const buildPayload = {
            source_blob: {
                url: `https://github.com/${repo}/tarball/main`
            }
        };

        const response = await fetch(herokuApi, {
            method: "POST",
            headers: {
                "Accept": "application/vnd.heroku+json; version=3",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.HEROKU_API_KEY}`
            },
            body: JSON.stringify(buildPayload)
        });

        const result = await response.json();

        if (response.status !== 201) {
            return reply(`❌ *Update Failed!*\n\nError: ${result.message || "Unknown error"}`);
        }

        // Notify user that update is in progress
        reply(`🚀 *Update Started!*\nYour bot is now updating to the latest version. This may take a few minutes.\n\n⏳ Please wait...`);

    } catch (error) {
        reply(`⚠️ *Update Error!*\n\n${error.message}`);
    }
    }
