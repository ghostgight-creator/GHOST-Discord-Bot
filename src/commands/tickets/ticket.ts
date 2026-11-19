import { 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  SlashCommandBuilder, 
  TextChannel 
} from 'discord.js';
import { Command } from '../../types';
import { ticketService } from '../../services/ticketService';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system management commands | إدارة نظام التذاكر والدعم')
    .addSubcommand(sub =>
      sub.setName('panel')
        .setDescription('Sends interactive ticket creation panel | نشر لوحة التذاكر')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  category: 'tickets',
  descriptionAr: 'نشر لوحة التذاكر التفاعلية ذات التصميم المخصص',
  exampleUsage: '/ticket panel',
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId || !interaction.channel) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: '❌ هذا الأمر يتطلب صلاحية إدارة القنوات (Manage Channels).',
        ephemeral: true
      });
      return;
    }

    const payload = ticketService.buildTicketPanel(interaction.guildId);
    await (interaction.channel as TextChannel).send(payload);

    await interaction.reply({
      content: '✅ تم إرسال لوحة التذاكر بنجاح!',
      ephemeral: true
    });
  }
};
