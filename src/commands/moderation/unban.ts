import { 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { LogService } from '../../services/logService';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user using their ID | إلغاء حظر مستخدم بالمعرف')
    .addStringOption(opt =>
      opt.setName('user_id')
        .setDescription('The ID of the user to unban | آيدي المستخدم المراد فك حظره')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for unbanning | سبب إلغاء الحظر')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  category: 'moderation',
  descriptionAr: 'فك الحظر عن طريق الآيدي وتسجيل العملية',
  exampleUsage: '/unban user_id:1234567890 reason:عفو إداري',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const userId = interaction.options.getString('user_id', true).trim();
    const reason = interaction.options.getString('reason') || 'No reason specified';

    if (!/^\d+$/.test(userId)) {
      await interaction.reply({ content: '❌ صيغة الآيدي غير صحيحة، يجب أن يحتوي على أرقام فقط.', ephemeral: true });
      return;
    }

    try {
      const ban = await guild.bans.fetch(userId).catch(() => null);
      if (!ban) {
        await interaction.reply({ content: '❌ هذا المستخدم غير محظور في هذا السيرفر.', ephemeral: true });
        return;
      }

      await guild.members.unban(userId, `By ${interaction.user.tag}: ${reason}`);

      await LogService.logModeration(guild, 'Member Unbanned (إلغاء حظر)', interaction.user, ban.user, reason);

      await interaction.reply({
        content: `🔓 تم إلغاء حظر المستخدم <@${userId}> (\`${ban.user.tag}\`) بنجاح.\n📝 **السبب:** ${reason}`,
        ephemeral: true
      });
    } catch (err: any) {
      await interaction.reply({
        content: `❌ تعذر فك الحظر: ${err.message}`,
        ephemeral: true
      });
    }
  }
};
