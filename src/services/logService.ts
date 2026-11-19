import { EmbedBuilder, Guild, TextChannel, User } from 'discord.js';
import { db } from '../database';
import { CONFIG } from '../config';

export class LogService {
  public static async logModeration(
    guild: Guild,
    action: string,
    moderator: User,
    target: User,
    reason: string,
    extraFields?: { name: string; value: string; inline?: boolean }[]
  ): Promise<void> {
    const settings = db.getGuildSettings(guild.id);
    if (!settings.log_channel_id) return;

    const channel = guild.channels.cache.get(settings.log_channel_id) as TextChannel | undefined;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ${settings.bot_name} Moderation Log: ${action}`)
      .setColor(CONFIG.COLORS.SECONDARY as any)
      .addFields(
        { name: '👤 Target', value: `<@${target.id}> (\`${target.tag}\` | \`${target.id}\`)`, inline: false },
        { name: '👮 Moderator', value: `<@${moderator.id}> (\`${moderator.tag}\`)`, inline: true },
        { name: '📝 Reason', value: `\`\`\`\n${reason || 'No reason provided'}\n\`\`\``, inline: false },
        ...(extraFields || [])
      )
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `${settings.bot_name} • Audit Log` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(err => console.error('[Log Moderation Error]', err));
  }
}
