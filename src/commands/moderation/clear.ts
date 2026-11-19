import { 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  SlashCommandBuilder, 
  TextChannel 
} from 'discord.js';
import { Command } from '../../types';
import { LogService } from '../../services/logService';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Purges messages from current channel | مسح عدد من الرسائل')
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (1 to 100) | عدد الرسائل المراد مسحها')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  category: 'moderation',
  descriptionAr: 'مسح رسائل الشات دفعة واحدة مع تسجيل العملية',
  exampleUsage: '/clear amount:20',
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel as TextChannel;
    if (!channel || !interaction.guild) return;

    const amount = interaction.options.getInteger('amount', true);

    try {
      const deleted = await channel.bulkDelete(amount, true);

      await LogService.logModeration(
        interaction.guild,
        'Messages Cleared (مسح رسائل)',
        interaction.user,
        interaction.user,
        `Purged ${deleted.size} messages in #${channel.name}`,
        [
          { name: '💬 Channel', value: `<#${channel.id}>`, inline: true },
          { name: '🗑️ Deleted Count', value: `${deleted.size}`, inline: true }
        ]
      );

      await interaction.reply({
        content: `🧹 تم مسح **${deleted.size}** رسالة بنجاح.`,
        ephemeral: true
      });
    } catch (err: any) {
      await interaction.reply({
        content: `❌ تعذر مسح الرسائل: ${err.message}`,
        ephemeral: true
      });
    }
  }
};
