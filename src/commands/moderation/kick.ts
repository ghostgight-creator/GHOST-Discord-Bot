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
    .setName('kick')
    .setDescription('Kicks a member from the server | طرد عضو من السيرفر')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('The member to kick | العضو المراد طرده')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for kicking | سبب الطرد')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  category: 'moderation',
  descriptionAr: 'طرد عضو من السيرفر مع فحص ترتيب الرتب وتسجيل السبب',
  exampleUsage: '/kick target:@user reason:إزعاج مستمر',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const targetUser = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason') || 'No reason specified';

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      await interaction.reply({ content: '❌ العضو غير موجود في السيرفر.', ephemeral: true });
      return;
    }

    if (targetMember.id === interaction.user.id) {
      await interaction.reply({ content: '❌ لا يمكنك طرد نفسك.', ephemeral: true });
      return;
    }

    const executor = interaction.member as GuildMember;
    const botMember = guild.members.me;

    if (guild.ownerId !== interaction.user.id && executor.roles.highest.position <= targetMember.roles.highest.position) {
      await interaction.reply({ content: '❌ لا يمكنك طرد عضو رتبته مساوية أو أعلى من رتبتك.', ephemeral: true });
      return;
    }

    if (!targetMember.kickable || (botMember && botMember.roles.highest.position <= targetMember.roles.highest.position)) {
      await interaction.reply({ content: '❌ البوت لا يملك الصلاحية لطرد هذا العضو (رتبته أعلى من رتبة البوت).', ephemeral: true });
      return;
    }

    await targetMember.kick(`By ${interaction.user.tag}: ${reason}`);

    await LogService.logModeration(guild, 'Member Kicked (طرد عضو)', interaction.user, targetUser, reason);

    await interaction.reply({
      content: `👢 تم طرد العضو <@${targetUser.id}> (\`${targetUser.tag}\`) بنجاح.\n📝 **السبب:** ${reason}`,
      ephemeral: true
    });
  }
};
