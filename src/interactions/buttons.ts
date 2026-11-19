import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonInteraction, 
  ButtonStyle, 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} from 'discord.js';
import { ticketService } from '../services/ticketService';
import { robloxService } from '../services/robloxService';
import { db } from '../database';
import { buildSetupPanel } from '../commands/setup/setup';
import { CONFIG } from '../config';
import { getLang } from '../services/translationService';

export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  const customId = interaction.customId;
  const guild = interaction.guild;
  if (!guild) return;

  const settings = db.getGuildSettings(guild.id);
  const lang = getLang(settings.language);
  const isAr = settings.language === 'ar';

  // 1. Ticket Claim
  if (customId.startsWith('ticket_claim_')) {
    const channelId = customId.replace('ticket_claim_', '');
    await ticketService.claimTicket(interaction, channelId);
    return;
  }

  // 2. Ticket Close (Open Modal)
  if (customId.startsWith('ticket_close_')) {
    const channelId = customId.replace('ticket_close_', '');
    const modal = new ModalBuilder()
      .setCustomId(`ticket_close_modal_${channelId}`)
      .setTitle(lang.tickets.closeModalTitle)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('close_reason_input')
            .setLabel(lang.tickets.closeReasonLabel)
            .setPlaceholder('مثال: تم حل المشكلة / انتهى الاستفسار')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        )
      );

    await interaction.showModal(modal);
    return;
  }

  // 3. Ticket Add Member (Open Modal)
  if (customId.startsWith('ticket_add_')) {
    const channelId = customId.replace('ticket_add_', '');
    const modal = new ModalBuilder()
      .setCustomId(`ticket_add_modal_${channelId}`)
      .setTitle(lang.tickets.btnAddMember)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('add_user_id_input')
            .setLabel(isAr ? 'معرف العضو (User ID) أو المنشن' : 'User ID or Mention')
            .setPlaceholder('123456789012345678')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
    return;
  }

  // 4. Setup Toggle Language
  if (customId === 'setup_toggle_lang') {
    const newLang = settings.language === 'ar' ? 'en' : 'ar';
    db.updateGuildSettings(guild.id, { language: newLang });
    const payload = buildSetupPanel(guild.id);
    await interaction.update(payload);
    return;
  }

  // 5. Setup Toggle Admin Only
  if (customId === 'setup_toggle_admin_only') {
    const newToggle = settings.admin_only_commands ? 0 : 1;
    db.updateGuildSettings(guild.id, { admin_only_commands: newToggle });
    const payload = buildSetupPanel(guild.id);
    await interaction.update(payload);
    return;
  }

  // 6. Avatar Switch (Server / Global)
  if (customId.startsWith('avatar_switch_')) {
    const parts = customId.split('_');
    const targetUserId = parts[2];
    const viewType = parts[3]; // 'server' or 'global'

    const targetUser = await interaction.client.users.fetch(targetUserId);
    const member = await guild.members.fetch(targetUserId).catch(() => null);

    const url = (viewType === 'server' && member?.avatar)
      ? member.avatarURL({ size: 1024, extension: 'png' })
      : targetUser.displayAvatarURL({ size: 1024, extension: 'png' });

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar (${viewType.toUpperCase()}) • ${targetUser.username}`)
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .setImage(url)
      .setFooter({ text: `${settings.bot_name} • High Resolution Viewer` })
      .setTimestamp();

    await interaction.update({ embeds: [embed] });
    return;
  }

  // 7. Roblox Avatar Toggle Full / Headshot
  if (customId.startsWith('roblox_avatar_full_') || customId.startsWith('roblox_toggle_body_') || customId.startsWith('roblox_toggle_head_')) {
    const isHead = customId.startsWith('roblox_toggle_head_');
    const userIdStr = customId.split('_').pop() || '0';
    const userId = parseInt(userIdStr, 10);

    const [details, thumbs] = await Promise.all([
      robloxService.getUserDetails(userId),
      robloxService.getUserThumbnails(userId)
    ]);

    const username = details.data?.name || 'Roblox User';
    const displayName = details.data?.displayName || username;

    const embed = new EmbedBuilder()
      .setTitle(`🧍 ${displayName} (@${username}) • Avatar (${isHead ? 'Headshot' : 'Full Body'})`)
      .setColor(CONFIG.COLORS.ROBLOX as any)
      .setImage(isHead ? thumbs.headshot : (thumbs.fullBody || thumbs.headshot))
      .setFooter({ text: `${settings.bot_name} • Roblox Avatar Viewer` })
      .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`roblox_toggle_head_${userId}`)
        .setLabel(lang.roblox.btnAvatarHead)
        .setStyle(isHead ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setEmoji('👤'),
      new ButtonBuilder()
        .setCustomId(`roblox_toggle_body_${userId}`)
        .setLabel(lang.roblox.btnAvatarFull)
        .setStyle(isHead ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setEmoji('🧍')
    );

    if (interaction.message.flags.has('Ephemeral')) {
      await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    }
    return;
  }

  // 8. Roblox Groups (with pagination)
  if (customId.startsWith('roblox_groups_')) {
    const parts = customId.split('_');
    const userId = parseInt(parts[2], 10);
    let page = parseInt(parts[3] || '0', 10);

    const groupsRes = await robloxService.getUserGroups(userId);
    const groups = groupsRes.groups || [];

    if (groups.length === 0) {
      await interaction.reply({ content: lang.roblox.noGroups, ephemeral: true });
      return;
    }

    const pageSize = 5;
    const totalPages = Math.ceil(groups.length / pageSize);
    if (page >= totalPages) page = totalPages - 1;
    if (page < 0) page = 0;

    const currentSlice = groups.slice(page * pageSize, (page + 1) * pageSize);

    const embed = new EmbedBuilder()
      .setTitle(`👥 ${lang.roblox.groupsTitle} (${groups.length})`)
      .setColor(CONFIG.COLORS.ROBLOX as any)
      .setFooter({ text: `Page ${page + 1} of ${totalPages} • ${settings.bot_name}` })
      .setTimestamp();

    currentSlice.forEach(g => {
      embed.addFields({
        name: `🏰 ${g.group.name} (\`ID: ${g.group.id}\`)`,
        value: `🎖️ **${isAr ? 'الرتبة:' : 'Role:'}** ${g.role.name} (\`Rank: ${g.role.rank}\`)\n🔗 [${isAr ? 'رابط المجموعة' : 'Group Link'}](https://www.roblox.com/groups/${g.group.id})`
      });
    });

    const navButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`roblox_groups_${userId}_${page - 1}`)
        .setLabel('◀️ السابق')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId(`roblox_groups_${userId}_${page + 1}`)
        .setLabel('التالي ▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages - 1)
    );

    if (interaction.isButton()) {
      await interaction.reply({ embeds: [embed], components: [navButtons], ephemeral: true });
    }
  }
}
