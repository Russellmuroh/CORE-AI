import { WAMessage, WASocket, WAMediaUpload, WAProto } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

class GroupManager {
  private groupSettings: Map<string, {
    antiLink: boolean;
    antiDelete: boolean;
    welcomeMessage?: string;
  }> = new Map();

  private cachedGroupMetadata: Map<string, WAProto.IGroupMetadata> = new Map();

  constructor() {
    setInterval(() => this.cachedGroupMetadata.clear(), 1000 * 60 * 30); // Clear cache every 30 mins
  }

  // ==================== Core Functions ====================
  async handleCommand(sock: WASocket, msg: WAMessage) {
    if (!msg.key.remoteJid?.endsWith('@g.us')) return;

    try {
      const groupJid = msg.key.remoteJid;
      const [cmd, ...args] = msg.message?.conversation?.split(' ') || [];
      const content = args.join(' ');

      // Refresh cache if empty
      if (!this.cachedGroupMetadata.has(groupJid)) {
        this.cachedGroupMetadata.set(groupJid, await sock.groupMetadata(groupJid));
      }

      const metadata = this.cachedGroupMetadata.get(groupJid)!;
      const isAdmin = metadata.participants.find(p => 
        p.id === msg.key.participant && p.admin === 'admin'
      );

      if (!isAdmin) {
        return sock.sendMessage(groupJid, { text: '❌ Admin privileges required' });
      }

      switch(cmd?.toLowerCase()) {
        case 'add': return this.addMember(sock, groupJid, content);
        case 'kick': return this.removeMember(sock, groupJid, content);
        case 'promote': return this.changeAdmin(sock, groupJid, content, 'promote');
        case 'demote': return this.changeAdmin(sock, groupJid, content, 'demote');
        case 'open': return this.setGroupLock(sock, groupJid, false);
        case 'close': return this.setGroupLock(sock, groupJid, true);
        case 'setdesc': return this.setDescription(sock, groupJid, content);
        case 'setname': return this.setGroupName(sock, groupJid, content);
        case 'antilink': return this.toggleAntiLink(sock, groupJid);
        case 'antidelete': return this.toggleAntiDelete(sock, groupJid);
        case 'listadmins': return this.listAdmins(sock, groupJid);
        case 'listmembers': return this.listMembers(sock, groupJid);
        case 'tagall': return this.mentionAll(sock, groupJid);
        case 'setwelcome': return this.setWelcomeMessage(sock, groupJid, content);
        default: return sock.sendMessage(groupJid, { text: '❌ Invalid command' });
      }
    } catch (error) {
      console.error('Command error:', error);
      if (error instanceof Boom) {
        await sock.sendMessage(msg.key.remoteJid!, { 
          text: `❌ Error: ${error.output.payload.message}` 
        });
      }
    }
  }

  // ==================== Command Handlers ====================
  private async addMember(sock: WASocket, groupJid: string, phone: string) {
    await sock.groupParticipantsUpdate(
      groupJid, 
      [`${phone.replace(/[^0-9]/g, '')}@s.whatsapp.net`], 
      'add'
    );
    await sock.sendMessage(groupJid, { text: `✅ Added ${phone}` });
  }

  private async toggleAntiLink(sock: WASocket, groupJid: string) {
    const settings = this.getGroupSettings(groupJid);
    settings.antiLink = !settings.antiLink;
    await sock.sendMessage(groupJid, {
      text: `🔗 Anti-Link ${settings.antiLink ? 'ENABLED' : 'DISABLED'}`
    });
  }

  private async setWelcomeMessage(sock: WASocket, groupJid: string, text: string) {
    const settings = this.getGroupSettings(groupJid);
    settings.welcomeMessage = text;
    await sock.sendMessage(groupJid, {
      text: `🎉 Welcome message set:\n"${text}"`
    });
  }

  // ==================== Event Handlers ====================
  async handleMessages(sock: WASocket, msg: WAMessage) {
    if (!msg.key.remoteJid?.endsWith('@g.us')) return;

    const groupJid = msg.key.remoteJid;
    const settings = this.getGroupSettings(groupJid);

    // Anti-Link Check
    if (settings.antiLink) {
      await this.checkLinks(sock, msg);
    }

    // Welcome New Members
    if (msg.message?.protocolMessage?.type === WAProto.ProtocolMessage.ProtocolMessageType.GROUP_PARTICIPANT_ADD) {
      await this.sendWelcome(sock, msg);
    }
  }

  private async checkLinks(sock: WASocket, msg: WAMessage) {
    const groupJid = msg.key.remoteJid!;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    
    if (/(https?:\/\/[^\s]+)/g.test(text)) {
      await sock.sendMessage(groupJid, { delete: msg.key });
      await sock.sendMessage(groupJid, {
        text: `⚠️ @${msg.key.participant?.split('@')[0]} - Links forbidden!`,
        mentions: [msg.key.participant!]
      });
    }
  }

  private async sendWelcome(sock: WASocket, msg: WAMessage) {
    const groupJid = msg.key.remoteJid!;
    const settings = this.getGroupSettings(groupJid);
    
    if (settings.welcomeMessage) {
      const newMembers = msg.message?.protocolMessage?.groupParticipantAdd?.participants || [];
      await sock.sendMessage(groupJid, {
        text: `👋 Welcome ${newMembers.map(m => `@${m.split('@')[0]}`).join(' ')}!\n${settings.welcomeMessage}`,
        mentions: newMembers
      });
    }
  }

  // ==================== Helpers ====================
  private getGroupSettings(groupJid: string) {
    if (!this.groupSettings.has(groupJid)) {
      this.groupSettings.set(groupJid, { 
        antiLink: false, 
        antiDelete: false 
      });
    }
    return this.groupSettings.get(groupJid)!;
  }
}

// Singleton instance
export default new GroupManager();
