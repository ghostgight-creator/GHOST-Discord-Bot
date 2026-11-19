import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { CONFIG } from '../../config';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays details and statistics about the server | إحصائيات ومعلومات السيرفر'),
  category: 'general',
  descriptionAr: 'معلومات السيرفر وعدد الأعضاء والقنوات والبوست',
  exampleUsage: '/serverinfo',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const settings = db.getGuildSettings(guild.id);
    const isAr = settings.language === 'ar';

    const owner = await guild.fetchOwner().catch(() => null);
    const totalMembers = guild.memberCount;
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setTitle(`🏰 ${guild.name} • Server Statistics`)
      .setThumbnail(guild.iconURL({ size: 512 }) || null)
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .addFields(
        { name: isAr ? '👑 مالك السيرفر' : '👑 Owner', value: owner ? `<@${owner.id}> (\`${owner.user.tag}\`)` : 'N/A', inline: false },
        { name: isAr ? '🆔 معرّف السيرفر' : '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
        { name: isAr ? '📅 تاريخ الإنشاء' : '📅 Created On', value: `<t:${createdTimestamp}:D>`, inline: true },
        { name: isAr ? '👥 الأعضاء' : '👥 Total Members', value: `\`${totalMembers}\``, inline: true },
        { name: isAr ? '💬 الرومات الكتابية' : '💬 Text Channels', value: `\`${textChannels}\``, inline: true },
        { name: isAr ? '🔊 الرومات الصوتية' : '🔊 Voice Channels', value: `\`${voiceChannels}\``, inline: true },
        { name: isAr ? '🏷️ عدد الرتب' : '🏷️ Roles Count', value: `\`${guild.roles.cache.size}\``, inline: true },
        { name: isAr ? '🚀 مستوى البوست' : '🚀 Boost Level', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true }
      )
      .setFooter({ text: `${settings.bot_name} • Server Analytics` })
      .setTimestamp();

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }) || null);
    }

    await interaction.reply({ embeds: [embed] });
  }
};
