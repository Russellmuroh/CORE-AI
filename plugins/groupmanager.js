import { WAMessage, WASocket } from '@whiskeysockets/baileys';

export default class GroupManager {
    constructor() {
        this.groupSettings = new Map(); // Stores { antiLink, antiDelete, welcomeMsg }
        this.metadataCache = new Map(); // Caches group metadata
        this.commands = [
            'add', 'kick', 'promote', 'demote',
            'open', 'close', 'setdesc', 'setname', 'antilink', 'antidelete',
            'listadmins', 'listmembers', 'tagall', 'setwelcome'
        ];
    }

    async handleCommand(sock, m, { isAdmin, isBotAdmin }) {
        if (!m.isGroup || !isAdmin) return;

        const messageText = m.body.toLowerCase().trim();  // Convert message to lowercase

        // Check if the message contains any command
        const command = this.commands.find(cmd => messageText.includes(cmd));

        if (!command) return;  // If no command found, do nothing

        const args = messageText.slice(command.length).trim().split(' ');  // Get arguments after the command
        const content = args.join(' ').trim();  // Join remaining arguments

        try {
            // Member Management
            if (command === 'add') {
                if (!isBotAdmin) throw new Error('Bot needs admin rights');
                await this._addMember(sock, m.from, content);
            }
            else if (command === 'kick') {
                await this._removeMember(sock, m.from, content);
            }
            else if (command === 'promote') {
                await this._changeAdmin(sock, m.from, content, 'promote');
            }
            else if (command === 'demote') {
                await this._changeAdmin(sock, m.from, content, 'demote');
            }

            // Group Settings
            else if (command === 'open') {
                await this._setGroupLock(sock, m.from, false);
            }
            else if (command === 'close') {
                await this._setGroupLock(sock, m.from, true);
            }
            else if (command === 'setdesc') {
                await this._setDescription(sock, m.from, content);
            }
            else if (command === 'setname') {
                await this._setGroupName(sock, m.from, content);
            }
            else if (command === 'antilink') {
                await this._toggleSetting(sock, m.from, 'antiLink');
            }
            else if (command === 'antidelete') {
                await this._toggleSetting(sock, m.from, 'antiDelete');
            }

            // Utilities
            else if (command === 'listadmins') {
                await this._listAdmins(sock, m.from);
            }
            else if (command === 'listmembers') {
                await this._listMembers(sock, m.from);
            }
            else if (command === 'tagall') {
                await this._mentionAll(sock, m.from);
            }
            else if (command === 'setwelcome') {
                await this._setWelcomeMessage(sock, m.from, content);
            }
            else {
                throw new Error('Unknown command');
            }

        } catch (error) {
            await sock.sendMessage(m.from, { text: `❌ Error: ${error.message}` });
        }
    }

    async handleMessages(sock, m) {
        if (!m.isGroup) return;
        const settings = this.groupSettings.get(m.from) || {};

        // Anti-link protection
        if (settings.antiLink && /https?:\/\/[^\s]+/.test(m.body)) {
            await sock.sendMessage(m.from, { delete: m.key });
            await sock.sendMessage(m.from, {
                text: `⚠️ @${m.sender.split('@')[0]} Links are not allowed!`,
                mentions: [m.sender]
            });
        }

        // Welcome new members
        if (m.message?.protocolMessage?.type === 2 && settings.welcomeMsg) {
            const newMembers = m.message.protocolMessage.groupParticipantAdd?.participants || [];
            await sock.sendMessage(m.from, {
                text: `👋 ${newMembers.map(m => `@${m.split('@')[0]}`).join(' ')}\n${settings.welcomeMsg}`,
                mentions: newMembers
            });
        }
    }

    // ============= PRIVATE METHODS =============
    async _addMember(sock, groupJid, phone) {
        const userJid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
        await sock.groupParticipantsUpdate(groupJid, [userJid], 'add');
        await sock.sendMessage(groupJid, { text: `✅ Added ${phone}` });
    }

    async _removeMember(sock, groupJid, phone) {
        const userJid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
        await sock.groupParticipantsUpdate(groupJid, [userJid], 'remove');
        await sock.sendMessage(groupJid, { text: `🚪 Kicked ${phone}` });
    }

    async _changeAdmin(sock, groupJid, phone, action) {
        const userJid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
        await sock.groupParticipantsUpdate(groupJid, [userJid], action);
        await sock.sendMessage(groupJid, {
            text: `👑 ${action === 'promote' ? 'Promoted' : 'Demoted'} ${phone}`
        });
    }

    async _setGroupLock(sock, groupJid, locked) {
        await sock.groupSettingUpdate(groupJid, locked ? 'announcement' : 'not_announcement');
        await sock.sendMessage(groupJid, { text: `🔒 Group ${locked ? 'locked' : 'unlocked'}` });
    }

    async _setDescription(sock, groupJid, text) {
        await sock.groupUpdateDescription(groupJid, text);
        await sock.sendMessage(groupJid, { text: '📝 Description updated' });
    }

    async _setGroupName(sock, groupJid, name) {
        await sock.groupUpdateSubject(groupJid, name);
        await sock.sendMessage(groupJid, { text: `🏷️ Group renamed to "${name}"` });
    }

    async _toggleSetting(sock, groupJid, setting) {
        const settings = this.groupSettings.get(groupJid) || {};
        settings[setting] = !settings[setting];
        this.groupSettings.set(groupJid, settings);
        await sock.sendMessage(groupJid, {
            text: `⚙️ ${setting.replace('anti', '').toUpperCase()} ${settings[setting] ? 'ON' : 'OFF'}`
        });
    }

    async _listAdmins(sock, groupJid) {
        const metadata = await this._getGroupMetadata(sock, groupJid);
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id.split('@')[0]);
        await sock.sendMessage(groupJid, {
            text: `👑 Admins:\n${admins.map(a => `• ${a}`).join('\n')}`
        });
    }

    async _listMembers(sock, groupJid) {
        const metadata = await this._getGroupMetadata(sock, groupJid);
        const members = metadata.participants.map(p => p.id.split('@')[0]);
        await sock.sendMessage(groupJid, {
            text: `👥 Members (${members.length}):\n${members.map(m => `• ${m}`).join('\n')}`
        });
    }

    async _mentionAll(sock, groupJid) {
        const metadata = await this._getGroupMetadata(sock, groupJid);
        await sock.sendMessage(groupJid, {
            text: '📢 @everyone',
            mentions: metadata.participants.map(p => p.id)
        });
    }

    async _setWelcomeMessage(sock, groupJid, text) {
        const settings = this.groupSettings.get(groupJid) || {};
        settings.welcomeMsg = text;
        this.groupSettings.set(groupJid, settings);
        await sock.sendMessage(groupJid, { text: '🎉 Welcome message set!' });
    }

    async _getGroupMetadata(sock, groupJid) {
        if (!this.metadataCache.has(groupJid)) {
            this.metadataCache.set(groupJid, await sock.groupMetadata(groupJid));
        }
        return this.metadataCache.get(groupJid);
    }
  }
