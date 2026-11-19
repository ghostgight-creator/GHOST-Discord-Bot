import { 
  ChatInputCommandInteraction, 
  GuildMember, 
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { LogService } from '../../services/logService';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a member permanently | حظر عضو نهائياً من السيرفر')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('The member to ban | العضو المراد حظره')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for banning | سبب الحظر')
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('delete_days')
        .setDescription('Days of messages to delete (0-7) | مسح الرسائل السابقة بالأيام')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  category: 'moderation',
  descriptionAr: 'حظر عضو من السيرفر مع فحص ترتيب الرتب ومسح الرسائل',
  exampleUsage: '/ban target:@user reason:تخريب delete_days:1',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const targetUser = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason') || 'No reason specified';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({ content: '❌ لا يمكنك حظر نفسك.', ephemeral: true });
      return;
    }

    const executor = interaction.member as GuildMember;
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    const botMember = guild.members.me;

    if (targetMember && guild.ownerId !== interaction.user.id) {
      if (executor.roles.highest.position <= targetMember.roles.highest.position) {
        await interaction.reply({ content: '❌ لا يمكنك حظر عضو رتبته مساوية أو أعلى من رتبتك.', ephemeral: true });
        return;
      }
    }

    if (targetMember && (!targetMember.bannable || (botMember && botMember.roles.highest.position <= targetMember.roles.highest.position))) {
      await interaction.reply({ content: '❌ البوت لا يملك الصلاحية لحظر هذا العضو (رتبته أعلى من رتبة البوت).', ephemeral: true });
      return;
    }

    await guild.members.ban(targetUser.id, {
      reason: `By ${interaction.user.tag}: ${reason}`,
      deleteMessageSeconds: deleteDays * 24 * 60 * 60
    });

    await LogService.logModeration(guild, 'Member Banned (حظر عضو)', interaction.user, targetUser, reason, [
      { name: '🗑️ Deleted Messages', value: `${deleteDays} days`, inline: true }
    ]);

    await interaction.reply({
      content: `🔨 تم حظر العضو <@${targetUser.id}> (\`${targetUser.tag}\`) بنجاح.\n📝 **السبب:** ${reason}`,
      ephemeral: true
    });
  }
};
