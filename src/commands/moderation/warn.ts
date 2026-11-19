import { 
  ChatInputCommandInteraction, 
  GuildMember, 
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { LogService } from '../../services/logService';
import { getLang } from '../../services/translationService';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issues a warning to a member | توجيه تحذير رسمي لعضو')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('The member to warn | العضو المراد تحذيره')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for the warning | سبب التحذير')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  category: 'moderation',
  descriptionAr: 'توجيه تحذير لعضو وحفظه في قاعدة البيانات وسجل اللوقات',
  exampleUsage: '/warn target:@user reason:إزعاج',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const settings = db.getGuildSettings(guild.id);
    const lang = getLang(settings.language);

    const targetUser = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason', true);

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({ content: '❌ لا يمكنك تحذير نفسك.', ephemeral: true });
      return;
    }

    if (targetUser.bot) {
      await interaction.reply({ content: '❌ لا يمكنك تحذير البوتات.', ephemeral: true });
      return;
    }

    const executorMember = interaction.member as GuildMember;
    const targetMember = guild.members.cache.get(targetUser.id);

    if (targetMember && guild.ownerId !== interaction.user.id) {
      if (executorMember.roles.highest.position <= targetMember.roles.highest.position) {
        await interaction.reply({
          content: '❌ لا يمكنك تحذير عضو رتبته أعلى منك أو مساوية لرتبتك.',
          ephemeral: true
        });
        return;
      }
    }

    const warning = db.addWarning(guild.id, targetUser.id, interaction.user.id, reason);
    const count = db.getWarnings(guild.id, targetUser.id).length;

    await LogService.logModeration(guild, 'Member Warned (تحذير عضو)', interaction.user, targetUser, reason, [
      { name: '📊 Total Warnings', value: `${count}`, inline: true },
      { name: '🆔 Warning ID', value: `#${warning.id}`, inline: true }
    ]);

    await interaction.reply({
      content: `⚠️ تم توجيه التحذير بنجاح لـ <@${targetUser.id}>.\n📝 **السبب:** ${reason}\n📊 **إجمالي التحذيرات:** ${count}`,
      ephemeral: true
    });
  }
};
