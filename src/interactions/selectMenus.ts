import { 
  ActionRowBuilder, 
  AnySelectMenuInteraction, 
  ChannelSelectMenuBuilder, 
  ChannelType, 
  ModalBuilder, 
  RoleSelectMenuBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} from 'discord.js';
import { db } from '../database';
import { buildSetupPanel } from '../commands/setup/setup';
import { getLang } from '../services/translationService';

export async function handleSelectMenuInteraction(interaction: AnySelectMenuInteraction): Promise<void> {
  const customId = interaction.customId;
  const guild = interaction.guild;
  if (!guild) return;

  const settings = db.getGuildSettings(guild.id);
  const lang = getLang(settings.language);

  // 1. Ticket Type Selection -> Trigger Modal
  if (customId === 'ticket_type_select' && interaction.isStringSelectMenu()) {
    const selectedType = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${selectedType}`)
      .setTitle(`${lang.tickets.modalTitle} [${selectedType.toUpperCase()}]`)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('ticket_reason_input')
            .setLabel(lang.tickets.modalReasonLabel)
            .setPlaceholder(lang.tickets.modalReasonPlaceholder)
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(5)
            .setMaxLength(1000)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
    return;
  }

  // 2. Setup Quick Action Picker
  if (customId === 'setup_quick_action' && interaction.isStringSelectMenu()) {
    const action = interaction.values[0];

    if (action === 'pick_welcome_channel') {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup_channel_select_welcome_channel_id')
        .setPlaceholder('اختر روم الترحيب...')
        .addChannelTypes(ChannelType.GuildText);
      await interaction.reply({
        content: '👋 **اختر روم الترحيب من القائمة أدناه:**',
        components: [new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect)],
        ephemeral: true
      });
      return;
    }

    if (action === 'pick_log_channel') {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup_channel_select_log_channel_id')
        .setPlaceholder('اختر روم السجلات (Logs)...')
        .addChannelTypes(ChannelType.GuildText);
      await interaction.reply({
        content: '📑 **اختر روم السجلات (Logs) من القائمة أدناه:**',
        components: [new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect)],
        ephemeral: true
      });
      return;
    }

    if (action === 'pick_ticket_category') {
      const categorySelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup_channel_select_ticket_category_id')
        .setPlaceholder('اختر قسم التذاكر (Category)...')
        .addChannelTypes(ChannelType.GuildCategory);
      await interaction.reply({
        content: '🎫 **اختر قسم التذاكر (Category) من القائمة أدناه:**',
        components: [new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(categorySelect)],
        ephemeral: true
      });
      return;
    }

    if (action === 'pick_support_role') {
      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId('setup_role_select_ticket_support_role_id')
        .setPlaceholder('اختر رتبة فريق الدعم الفني...');
      await interaction.reply({
        content: '🛡️ **اختر رتبة فريق الدعم الفني:**',
        components: [new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect)],
        ephemeral: true
      });
      return;
    }

    if (action === 'pick_admin_role') {
      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId('setup_role_select_ticket_admin_role_id')
        .setPlaceholder('اختر رتبة الشكاوى الإدارية...');
      await interaction.reply({
        content: '⚖️ **اختر رتبة المشرفين المخولين باستلام الشكاوى الإدارية:**',
        components: [new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect)],
        ephemeral: true
      });
      return;
    }

    if (action === 'pick_auto_role') {
      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId('setup_role_select_auto_role_id')
        .setPlaceholder('اختر الرتبة التلقائية للأعضاء الجدد...');
      await interaction.reply({
        content: '🏷️ **اختر الرتبة التي سيحصل عليها أي عضو جديد فور انضمامه:**',
        components: [new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect)],
        ephemeral: true
      });
      return;
    }
  }

  // 3. Handle Channel Updates
  if (customId.startsWith('setup_channel_select_') && interaction.isChannelSelectMenu()) {
    const field = customId.replace('setup_channel_select_', '');
    const selectedChannelId = interaction.values[0];

    db.updateGuildSettings(guild.id, { [field]: selectedChannelId });
    await interaction.update({
      content: `✅ تم تعيين القناة <#${selectedChannelId}> بنجاح!`,
      components: []
    });
    return;
  }

  // 4. Handle Role Updates
  if (customId.startsWith('setup_role_select_') && interaction.isRoleSelectMenu()) {
    const field = customId.replace('setup_role_select_', '');
    const selectedRoleId = interaction.values[0];

    db.updateGuildSettings(guild.id, { [field]: selectedRoleId });
    await interaction.update({
      content: `✅ تم تعيين الرتبة <@&${selectedRoleId}> بنجاح!`,
      components: []
    });
    return;
  }
}
