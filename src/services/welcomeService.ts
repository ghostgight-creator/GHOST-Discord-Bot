import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  Guild, 
  GuildMember 
} from 'discord.js';
import { db } from '../database';
import { CONFIG } from '../config';
import { getLang } from './translationService';

export class WelcomeService {
  public static buildWelcomePayload(
    guild: Guild, 
    member: { user: { id: string; username: string; tag: string; displayAvatarURL: (opts?: any) => string }; guild: Guild }, 
    isPreview: boolean = false
  ) {
    const settings = db.getGuildSettings(guild.id);
    const lang = getLang(settings.language);

    const rawMessage = settings.welcome_message || (settings.language === 'ar' ? CONFIG.DEFAULT_WELCOME_MESSAGE : CONFIG.DEFAULT_WELCOME_MESSAGE_EN);
    const formattedMessage = rawMessage
      .replace(/{user}/g, `<@${member.user.id}>`)
      .replace(/{server}/g, `**${guild.name}**`)
      .replace(/{memberCount}/g, `**${guild.memberCount}**`);

    const avatarUrl = member.user.displayAvatarURL({ size: 512, extension: 'png' });

    const embed = new EmbedBuilder()
      .setTitle(`✨ Welcome to ${guild.name} | مرحباً بك!`)
      .setDescription(formattedMessage)
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .setThumbnail(avatarUrl)
      .addFields(
        { 
          name: settings.language === 'ar' ? '👤 العضو' : '👤 Member', 
          value: `${member.user.username} (\`${member.user.id}\`)`, 
          inline: true 
        },
        { 
          name: settings.language === 'ar' ? '📊 عدد الأعضاء' : '📊 Total Members', 
          value: `#${guild.memberCount}`, 
          inline: true 
        },
        { 
          name: settings.language === 'ar' ? '🏰 السيرفر' : '🏰 Server', 
          value: guild.name, 
          inline: true 
        }
      )
      .setImage('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80')
      .setFooter({ 
        text: isPreview ? `[PREVIEW] ${settings.bot_name} Welcome System` : `${settings.bot_name} • Gaming Community`,
        iconURL: guild.iconURL() || undefined 
      })
      .setTimestamp();

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    if (settings.rules_channel_id) {
      const rulesRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(lang.welcome.rulesButton)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${guild.id}/${settings.rules_channel_id}`)
          .setEmoji('📜')
      );
      components.push(rulesRow);
    }

    return {
      content: isPreview ? `🔍 **${lang.welcome.previewTitle}**` : `<@${member.user.id}>`,
      embeds: [embed],
      components
    };
  }
}
