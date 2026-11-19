import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelSelectMenuBuilder, 
  ChannelType, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  RoleSelectMenuBuilder, 
  SlashCommandBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { CONFIG } from '../../config';
import { getLang } from '../../services/translationService';

export function buildSetupPanel(guildId: string) {
  const settings = db.getGuildSettings(guildId);
  const lang = getLang(settings.language);
  const isAr = settings.language === 'ar';

  const embed = new EmbedBuilder()
    .setTitle(lang.setup.title)
    .setDescription(lang.setup.description)
    .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
    .addFields(
      { name: '🌐 ' + (isAr ? 'اللغة' : 'Language'), value: isAr ? '🇸🇦 العربية' : '🇺🇸 English', inline: true },
      { name: '👋 ' + lang.setup.welcomeChannel, value: settings.welcome_channel_id ? `<#${settings.welcome_channel_id}>` : lang.setup.notSet, inline: true },
      { name: '📑 ' + lang.setup.logChannel, value: settings.log_channel_id ? `<#${settings.log_channel_id}>` : lang.setup.notSet, inline: true },
      { name: '🎫 ' + lang.setup.ticketCategory, value: settings.ticket_category_id ? `<#${settings.ticket_category_id}>` : lang.setup.notSet, inline: true },
      { name: '🛡️ ' + lang.setup.supportRole, value: settings.ticket_support_role_id ? `<@&${settings.ticket_support_role_id}>` : lang.setup.notSet, inline: true },
      { name: '⚖️ ' + lang.setup.adminRole, value: settings.ticket_admin_role_id ? `<@&${settings.ticket_admin_role_id}>` : lang.setup.notSet, inline: true },
      { name: '🏷️ ' + lang.setup.autoRole, value: settings.auto_role_id ? `<@&${settings.auto_role_id}>` : lang.setup.notSet, inline: true },
      { name: '🔒 ' + lang.setup.adminOnlyToggle, value: settings.admin_only_commands ? '✅ Active (Admins Only)' : '❌ Disabled (Public)', inline: true }
    )
    .setFooter({ text: `${settings.bot_name} • Dynamic Guild Config` })
    .setTimestamp();

  const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('setup_toggle_lang')
      .setLabel(isAr ? 'Switch to English' : 'التحويل للعربية')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🌐'),
    new ButtonBuilder()
      .setCustomId('setup_toggle_admin_only')
      .setLabel(isAr ? 'تبديل وضع حصر الإدارة' : 'Toggle Admin Only')
      .setStyle(settings.admin_only_commands ? ButtonStyle.Danger : ButtonStyle.Secondary)
      .setEmoji('🔒')
  );

  const actionSelect = new StringSelectMenuBuilder()
    .setCustomId('setup_quick_action')
    .setPlaceholder(isAr ? 'اختر الإعداد الذي ترغب بتعديله...' : 'Select setting to configure...')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(lang.setup.welcomeChannel)
        .setValue('pick_welcome_channel')
        .setEmoji('👋'),
      new StringSelectMenuOptionBuilder()
        .setLabel(lang.setup.logChannel)
        .setValue('pick_log_channel')
        .setEmoji('📑'),
      new StringSelectMenuOptionBuilder()
        .setLabel(lang.setup.ticketCategory)
        .setValue('pick_ticket_category')
        .setEmoji('🎫'),
      new StringSelectMenuOptionBuilder()
        .setLabel(lang.setup.supportRole)
        .setValue('pick_support_role')
        .setEmoji('🛡️'),
      new StringSelectMenuOptionBuilder()
        .setLabel(lang.setup.adminRole)
        .setValue('pick_admin_role')
        .setEmoji('⚖️'),
      new StringSelectMenuOptionBuilder()
        .setLabel(lang.setup.autoRole)
        .setValue('pick_auto_role')
        .setEmoji('🏷️')
    );

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(actionSelect);

  return { embeds: [embed], components: [buttonsRow, selectRow] };
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Opens interactive admin control panel | لوحة تحكم إعدادات البوت')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'setup',
  descriptionAr: 'لوحة تحكم تفاعلية لحفظ إعدادات السيرفر بدون تعديل كود',
  exampleUsage: '/setup',
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ هذا الأمر مخصص لمدراء السيرفر فقط (Administrator).',
        ephemeral: true
      });
      return;
    }

    const payload = buildSetupPanel(interaction.guildId);
    await interaction.reply({ ...payload, ephemeral: true });
  }
};
