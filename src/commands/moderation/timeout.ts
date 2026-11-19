import { 
  ChatInputCommandInteraction, 
  GuildMember, 
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { LogService } from '../../services/logService';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Temporarily time out a member | إسكات مؤقت لعضو بالدقائق')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('The member to time out | العضو المراد إسكاته')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('minutes')
        .setDescription('Duration in minutes (e.g. 5, 60) | مدة الإسكات بالدقائق')
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for the timeout | سبب التايم أوت')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  category: 'moderation',
  descriptionAr: 'إسكات عضو مؤقتاً بالدقائق وتسجيله في اللوقات',
  exampleUsage: '/timeout target:@user minutes:10 reason:مخالفة الشات',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const targetUser = interaction.options.getUser('target', true);
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') || 'No reason specified';

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      await interaction.reply({ content: '❌ العضو غير موجود في السيرفر.', ephemeral: true });
      return;
    }

    if (targetMember.id === interaction.user.id) {
      await interaction.reply({ content: '❌ لا يمكنك إعطاء تايم أوت لنفسك.', ephemeral: true });
      return;
    }

    const executor = interaction.member as GuildMember;
    const botMember = guild.members.me;

    if (guild.ownerId !== interaction.user.id && executor.roles.highest.position <= targetMember.roles.highest.position) {
      await interaction.reply({ content: '❌ لا يمكنك معاقبة عضو رتبته مساوية أو أعلى من رتبتك.', ephemeral: true });
      return;
    }

    if (!targetMember.moderatable || (botMember && botMember.roles.highest.position <= targetMember.roles.highest.position)) {
      await interaction.reply({ content: '❌ البوت لا يملك الصلاحية لمعاقبة هذا العضو (رتبته أعلى من رتبة البوت).', ephemeral: true });
      return;
    }

    const durationMs = minutes * 60 * 1000;
    await targetMember.timeout(durationMs, `By ${interaction.user.tag}: ${reason}`);

    await LogService.logModeration(guild, 'Member Timed Out (تايم أوت)', interaction.user, targetUser, reason, [
      { name: '⏱️ Duration', value: `${minutes} minutes`, inline: true }
    ]);

    await interaction.reply({
      content: `🔇 تم تطبيق التايم أوت على <@${targetUser.id}> لمدة **${minutes} دقيقة**.\n📝 **السبب:** ${reason}`,
      ephemeral: true
    });
  }
};
