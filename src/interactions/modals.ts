import { ModalSubmitInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { ticketService } from '../services/ticketService';
import { TicketType } from '../types';

export async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  const customId = interaction.customId;

  // 1. Ticket Creation Modal
  if (customId.startsWith('ticket_modal_')) {
    const ticketType = customId.replace('ticket_modal_', '') as TicketType;
    const reason = interaction.fields.getTextInputValue('ticket_reason_input');
    await ticketService.createTicket(interaction, ticketType, reason);
    return;
  }

  // 2. Ticket Close Modal
  if (customId.startsWith('ticket_close_modal_')) {
    const channelId = customId.replace('ticket_close_modal_', '');
    const reason = interaction.fields.getTextInputValue('close_reason_input') || 'No reason provided';
    const channel = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;

    if (!channel || !interaction.guild) {
      await interaction.reply({ content: '❌ الروم غير متاح أو تم حذفه بالفعل.', ephemeral: true });
      return;
    }

    await interaction.reply({ content: '⏳ جاري إنشاء الأرشيف (Transcript) وحذف الروم...', ephemeral: true });
    await ticketService.closeTicket(interaction.guild, channel, interaction.user, reason);
    return;
  }

  // 3. Ticket Add Member Modal
  if (customId.startsWith('ticket_add_modal_')) {
    const channelId = customId.replace('ticket_add_modal_', '');
    const targetInput = interaction.fields.getTextInputValue('add_user_id_input').trim();
    const cleanId = targetInput.replace(/[<@!>]/g, '');

    const channel = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;
    if (!channel) {
      await interaction.reply({ content: '❌ الروم غير متاح.', ephemeral: true });
      return;
    }

    try {
      const targetMember = await interaction.guild?.members.fetch(cleanId).catch(() => null);
      if (!targetMember) {
        await interaction.reply({ content: '❌ لم يتم العثور على العضو في السيرفر.', ephemeral: true });
        return;
      }

      await channel.permissionOverwrites.edit(targetMember.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true
      });

      await interaction.reply({
        content: `✅ تم إضافة <@${targetMember.id}> إلى التذكرة بنجاح.`,
        ephemeral: false
      });
    } catch (err: any) {
      await interaction.reply({ content: `❌ تعذر إضافة العضو: ${err.message}`, ephemeral: true });
    }
  }
}
