import { 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { CONFIG } from '../../config';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Displays warning history of a member | عرض سجل التحذيرات')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('The member whose warnings you want to view | العضو المراد استعراض تحذيراته')
        .setRequired(true)
    )
    .addBooleanOption(opt =>
      opt.setName('clear')
        .setDescription('Clear all warnings for this member | تصفير وحذف التحذيرات')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  category: 'moderation',
  descriptionAr: 'استعراض أو تصفير سجل تحذيرات العضو',
  exampleUsage: '/warnings target:@user',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const targetUser = interaction.options.getUser('target', true);
    const shouldClear = interaction.options.getBoolean('clear') || false;
    const settings = db.getGuildSettings(guild.id);
    const isAr = settings.language === 'ar';

    if (shouldClear) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({
          content: '❌ تصفير التحذيرات يتطلب صلاحية المدير (Administrator).',
          ephemeral: true
        });
        return;
      }
      const removed = db.clearWarnings(guild.id, targetUser.id);
      await interaction.reply({
        content: `✅ تم تصفير وحذف جميع تحذيرات <@${targetUser.id}> بنجاح (${removed} تحذير).`,
        ephemeral: true
      });
      return;
    }

    const list = db.getWarnings(guild.id, targetUser.id);

    if (list.length === 0) {
      await interaction.reply({
        content: `ℹ️ ${isAr ? `لا توجد أي تحذيرات مسجلة على <@${targetUser.id}>.` : `No warnings recorded for <@${targetUser.id}>.`}`,
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 Warnings History • ${targetUser.username}`)
      .setDescription(`إجمالي التحذيرات: **${list.length}**`)
      .setColor(CONFIG.COLORS.WARNING as any)
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({ text: `${settings.bot_name} • Infraction Records` })
      .setTimestamp();

    list.slice(0, 10).forEach((w, index) => {
      embed.addFields({
        name: `⚠️ #${w.id || index + 1} • <t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R>`,
        value: `👮 **المشرف:** <@${w.moderator_id}>\n📝 **السبب:** ${w.reason}`
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
