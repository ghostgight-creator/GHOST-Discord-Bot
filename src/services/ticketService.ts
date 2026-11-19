import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  ChatInputCommandInteraction, 
  Collection, 
  EmbedBuilder, 
  Guild, 
  GuildMember, 
  Message, 
  ModalSubmitInteraction, 
  OverwriteResolvable, 
  PermissionFlagsBits, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  TextChannel, 
  User 
} from 'discord.js';
import { db } from '../database';
import { TicketRecord, TicketType } from '../types';
import { getLang } from './translationService';
import { CONFIG } from '../config';

export class TicketService {
  // Generate Ticket Selection Panel
  public buildTicketPanel(guildId: string) {
    const settings = db.getGuildSettings(guildId);
    const lang = getLang(settings.language);

    const embed = new EmbedBuilder()
      .setTitle(lang.tickets.panelTitle)
      .setDescription(lang.tickets.panelDesc)
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .setImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80')
      .setFooter({ text: `${settings.bot_name} • Support System`, iconURL: undefined })
      .setTimestamp();

    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_type_select')
      .setPlaceholder(lang.tickets.selectPlaceholder)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(settings.language === 'ar' ? 'دعم فني' : 'Technical Support')
          .setValue('support')
          .setDescription(settings.language === 'ar' ? 'للمشاكل التقنية واستفسارات السيرفر' : 'Technical issues & general help')
          .setEmoji('🛠️'),
        new StringSelectMenuOptionBuilder()
          .setLabel(settings.language === 'ar' ? 'بلاغ على عضو' : 'Report a Member')
          .setValue('report')
          .setDescription(settings.language === 'ar' ? 'للإبلاغ عن مخالفة لقوانين السيرفر' : 'Report user violations or abuse')
          .setEmoji('🚨'),
        new StringSelectMenuOptionBuilder()
          .setLabel(settings.language === 'ar' ? 'شكوى إدارية' : 'Admin Complaint')
          .setValue('admin')
          .setDescription(settings.language === 'ar' ? 'شكاوى مباشرة للإدارة العليا' : 'Escalations directly to High Admins')
          .setEmoji('⚖️'),
        new StringSelectMenuOptionBuilder()
          .setLabel(settings.language === 'ar' ? 'استفسار عام' : 'General Inquiry')
          .setValue('inquiry')
          .setDescription(settings.language === 'ar' ? 'أي سؤال أو مساعدة عامة' : 'Questions & community inquiries')
          .setEmoji('❓')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    return { embeds: [embed], components: [row] };
  }

  // Create Ticket Channel
  public async createTicket(
    interaction: ModalSubmitInteraction, 
    ticketType: TicketType, 
    reason: string
  ): Promise<void> {
    const guild = interaction.guild;
    const user = interaction.user;
    if (!guild) return;

    const settings = db.getGuildSettings(guild.id);
    const lang = getLang(settings.language);

    // Duplicate Check
    const activeTicket = db.getActiveTicket(guild.id, user.id, ticketType);
    if (activeTicket) {
      await interaction.reply({
        content: `${lang.tickets.alreadyOpen} <#${activeTicket.channel_id}>`,
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const ticketNumber = db.getNextTicketNumber(guild.id);
    const paddedNumber = String(ticketNumber).padStart(4, '0');
    const channelName = `ticket-${ticketType}-${paddedNumber}`;

    // Permissions Overwrites
    const permissionOverwrites: OverwriteResolvable[] = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory
        ]
      },
      {
        id: guild.members.me?.id || interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];

    // Assign appropriate support or admin role
    if (ticketType === 'admin' && settings.ticket_admin_role_id) {
      permissionOverwrites.push({
        id: settings.ticket_admin_role_id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    } else if (settings.ticket_support_role_id) {
      permissionOverwrites.push({
        id: settings.ticket_support_role_id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    }

    try {
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: settings.ticket_category_id || undefined,
        topic: `Ticket #${paddedNumber} | User: ${user.tag} (${user.id}) | Type: ${ticketType}`,
        permissionOverwrites
      });

      // Save in DB
      db.createTicket({
        ticket_number: ticketNumber,
        guild_id: guild.id,
        channel_id: channel.id,
        user_id: user.id,
        ticket_type: ticketType,
        reason: reason.trim() || 'No reason specified',
        status: 'open',
        claimed_by: null,
        created_at: new Date().toISOString(),
        closed_at: null,
        closed_by: null,
        close_reason: null
      });

      // Send initial ticket message in the created channel
      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎫 ${settings.bot_name} - Ticket #${paddedNumber}`)
        .setDescription(lang.tickets.welcomeInTicket.replace('{user}', `<@${user.id}>`))
        .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
        .addFields(
          { name: settings.language === 'ar' ? '👤 صاحب التذكرة' : '👤 Ticket Creator', value: `<@${user.id}> (${user.tag})`, inline: true },
          { name: settings.language === 'ar' ? '🏷️ النوع' : '🏷️ Type', value: `\`${ticketType.toUpperCase()}\``, inline: true },
          { name: settings.language === 'ar' ? '📋 رقم التذكرة' : '📋 Ticket #', value: `#${paddedNumber}`, inline: true },
          { name: settings.language === 'ar' ? '📝 السبب والتفاصيل' : '📝 Reason & Details', value: `\`\`\`\n${reason.trim() || 'N/A'}\n\`\`\``, inline: false },
          { name: settings.language === 'ar' ? '✋ حالة الاستلام' : '✋ Claim Status', value: settings.language === 'ar' ? '*لم تُستلم بعد*' : '*Unclaimed*', inline: true }
        )
        .setFooter({ text: `${settings.bot_name} • Secure Ticket System` })
        .setTimestamp();

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_claim_${channel.id}`)
          .setLabel(lang.tickets.btnClaim)
          .setStyle(ButtonStyle.Success)
          .setEmoji('✋'),
        new ButtonBuilder()
          .setCustomId(`ticket_add_${channel.id}`)
          .setLabel(lang.tickets.btnAddMember)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('➕'),
        new ButtonBuilder()
          .setCustomId(`ticket_close_${channel.id}`)
          .setLabel(lang.tickets.btnClose)
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({
        content: `<@${user.id}> ${settings.ticket_support_role_id ? `<@&${settings.ticket_support_role_id}>` : ''}`,
        embeds: [ticketEmbed],
        components: [buttons]
      });

      await interaction.editReply({
        content: `${lang.tickets.createdSuccess} <#${channel.id}>`
      });
    } catch (error: any) {
      console.error('[Ticket Create Error]', error);
      await interaction.editReply({
        content: `❌ ${error.message || 'Failed to create ticket channel. Check bot permissions.'}`
      });
    }
  }

  // Claim Ticket
  public async claimTicket(interaction: any, channelId: string): Promise<void> {
    const ticket = db.getTicketByChannel(channelId);
    if (!ticket) {
      await interaction.reply({ content: '❌ Ticket record not found in database.', ephemeral: true });
      return;
    }

    const settings = db.getGuildSettings(interaction.guild.id);
    const lang = getLang(settings.language);

    if (ticket.status === 'claimed') {
      await interaction.reply({
        content: `⚠️ ${lang.tickets.claimedBy} <@${ticket.claimed_by}>`,
        ephemeral: true
      });
      return;
    }

    db.updateTicket(channelId, {
      status: 'claimed',
      claimed_by: interaction.user.id
    });

    const embed = new EmbedBuilder()
      .setDescription(`✋ ${lang.tickets.claimedBy} <@${interaction.user.id}>`)
      .setColor(CONFIG.COLORS.SUCCESS as any)
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Ticket claimed!', ephemeral: true });
  }

  // Close Ticket & Generate HTML Transcript
  public async closeTicket(
    guild: Guild, 
    channel: TextChannel, 
    closedByUser: User, 
    closeReason: string
  ): Promise<void> {
    const settings = db.getGuildSettings(guild.id);
    const lang = getLang(settings.language);
    const ticket = db.getTicketByChannel(channel.id);

    // Fetch messages for transcript
    const messages = await channel.messages.fetch({ limit: 100 });
    const sortedMessages = Array.from(messages.values()).reverse();

    // Build HTML Transcript
    const transcriptHtml = this.generateHtmlTranscript(ticket, channel, sortedMessages, closedByUser, closeReason);
    const buffer = Buffer.from(transcriptHtml, 'utf-8');

    // Send transcript to Logs channel if set
    if (settings.log_channel_id) {
      const logChannel = guild.channels.cache.get(settings.log_channel_id) as TextChannel | undefined;
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle(`📑 ${settings.bot_name} - Ticket Closed #${ticket?.ticket_number || 'N/A'}`)
          .setColor(CONFIG.COLORS.SECONDARY as any)
          .addFields(
            { name: '🎫 Ticket Channel', value: `\`${channel.name}\``, inline: true },
            { name: '👤 Owner', value: ticket ? `<@${ticket.user_id}>` : 'Unknown', inline: true },
            { name: '🏷️ Type', value: ticket ? ticket.ticket_type.toUpperCase() : 'N/A', inline: true },
            { name: '🔒 Closed By', value: `<@${closedByUser.id}> (${closedByUser.tag})`, inline: true },
            { name: '📝 Close Reason', value: `\`\`\`\n${closeReason}\n\`\`\``, inline: false },
            { name: '📅 Created At', value: ticket?.created_at || 'N/A', inline: true },
            { name: '⏱️ Closed At', value: new Date().toISOString(), inline: true }
          )
          .setFooter({ text: `${settings.bot_name} Ticket Transcripts` })
          .setTimestamp();

        await logChannel.send({
          embeds: [logEmbed],
          files: [{
            attachment: buffer,
            name: `transcript-${channel.name}.html`
          }]
        }).catch(err => console.error('[Log Transcript Send Error]', err));
      }
    }

    // Update in database
    if (ticket) {
      db.updateTicket(channel.id, {
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: closedByUser.id,
        close_reason: closeReason
      });
    }

    // Notify channel and delete
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🔒 Ticket Closing')
          .setDescription(lang.tickets.closeTranscriptSaved)
          .setColor(CONFIG.COLORS.ERROR as any)
      ]
    });

    setTimeout(async () => {
      await channel.delete(`Ticket closed by ${closedByUser.tag} | Reason: ${closeReason}`).catch(() => {});
    }, 5000);
  }

  // Generate Modern HTML Transcript
  private generateHtmlTranscript(
    ticket: TicketRecord | undefined,
    channel: TextChannel,
    messages: Message[],
    closedBy: User,
    reason: string
  ): string {
    const messageRows = messages.map(m => {
      const avatar = m.author.displayAvatarURL({ extension: 'png', size: 64 });
      const time = m.createdAt.toLocaleString();
      const content = m.cleanContent ? m.cleanContent.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
      const embedsCount = m.embeds.length ? `<span class="badge">[Embed]</span>` : '';
      const attachments = m.attachments.map(a => `<a href="${a.url}" target="_blank" class="att-link">📎 ${a.name}</a>`).join(' ');

      return `
        <div class="message">
          <img src="${avatar}" class="avatar" alt="Avatar"/>
          <div class="msg-content">
            <div class="msg-header">
              <span class="author">${m.author.tag}</span>
              <span class="timestamp">${time}</span>
              ${m.author.bot ? '<span class="badge-bot">BOT</span>' : ''}
            </div>
            <div class="text">${content} ${embedsCount} ${attachments}</div>
          </div>
        </div>
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Transcript - ${channel.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0b0914; color: #e2e8f0; margin: 0; padding: 24px; }
          .header { background: #17112c; border: 1px solid #7c3aed; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.2); }
          .title { font-size: 22px; font-weight: bold; color: #a78bfa; margin-bottom: 8px; }
          .meta { font-size: 14px; color: #94a3b8; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
          .message { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #1e1938; }
          .avatar { width: 44px; height: 44px; border-radius: 50%; }
          .msg-content { flex: 1; }
          .msg-header { margin-bottom: 4px; }
          .author { font-weight: bold; color: #c4b5fd; margin-right: 8px; }
          .timestamp { font-size: 12px; color: #64748b; }
          .badge-bot { background: #5800ff; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
          .badge { background: #7c3aed; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
          .text { font-size: 14px; line-height: 1.5; color: #f1f5f9; word-break: break-word; }
          .att-link { color: #38bdf8; text-decoration: none; font-size: 13px; display: inline-block; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">📜 GHOST Ticket Transcript: #${ticket?.ticket_number || channel.name}</div>
          <div class="meta">
            <div><strong>Channel:</strong> ${channel.name}</div>
            <div><strong>Owner ID:</strong> ${ticket?.user_id || 'N/A'}</div>
            <div><strong>Type:</strong> ${ticket?.ticket_type || 'N/A'}</div>
            <div><strong>Closed By:</strong> ${closedBy.tag}</div>
            <div><strong>Reason:</strong> ${reason}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>
        <div class="messages">
          ${messageRows}
        </div>
      </body>
      </html>
    `;
  }
}

export const ticketService = new TicketService();
