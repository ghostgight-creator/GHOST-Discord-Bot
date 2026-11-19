import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { CONFIG } from '../../config';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about a user | عرض معلومات العضو والحساب')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The member you want information about | العضو المراد استعراض معلوماته')
        .setRequired(false)
    ),
  category: 'general',
  descriptionAr: 'معلومات تفصيلية عن العضو وتاريخ انضمامه ورتبه',
  exampleUsage: '/userinfo target:@username',
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild?.members.cache.get(targetUser.id) as GuildMember | undefined;

    const settings = db.getGuildSettings(interaction.guildId || '');
    const isAr = settings.language === 'ar';

    const roles = member?.roles.cache
      .filter(r => r.id !== interaction.guildId)
      .map(r => `<@&${r.id}>`)
      .slice(0, 15)
      .join(', ') || (isAr ? 'لا توجد رتب' : 'None');

    const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1000);
    const joinedTimestamp = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${targetUser.username} • User Information`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .addFields(
        { name: isAr ? '📌 الاسم' : '📌 Username', value: `${targetUser.tag}`, inline: true },
        { name: isAr ? '🆔 المعرّف (ID)' : '🆔 User ID', value: `\`${targetUser.id}\``, inline: true },
        { name: isAr ? '🤖 نوع الحساب' : '🤖 Account Type', value: targetUser.bot ? 'Bot' : 'User', inline: true },
        { name: isAr ? '📅 إنشاء الحساب' : '📅 Account Created', value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`, inline: false },
        { 
          name: isAr ? '📥 الانضمام للسيرفر' : '📥 Joined Server', 
          value: joinedTimestamp ? `<t:${joinedTimestamp}:F> (<t:${joinedTimestamp}:R>)` : (isAr ? 'غير منضم' : 'Not in server'), 
          inline: false 
        },
        { name: isAr ? '👑 أعلى رتبة' : '👑 Highest Role', value: member?.roles.highest ? `<@&${member.roles.highest.id}>` : 'N/A', inline: true },
        { name: isAr ? '🏷️ الرتب' : '🏷️ Roles', value: roles, inline: false }
      )
      .setFooter({ text: `${settings.bot_name} • User Profile` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
