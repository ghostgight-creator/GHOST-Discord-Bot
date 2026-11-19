import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { robloxService } from '../../services/robloxService';
import { getLang } from '../../services/translationService';
import { CONFIG } from '../../config';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Roblox official community integration tools | خدمات وأدوات روبلوكس')
    .addSubcommand(sub =>
      sub.setName('user')
        .setDescription('Lookup Roblox user profile | فحص حساب روبلوكس عبر الاسم أو الرابط')
        .addStringOption(opt =>
          opt.setName('username')
            .setDescription('Roblox username or profile URL (e.g. builderman)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('avatar')
        .setDescription('Displays Roblox avatar headshot or full body | عرض أفتار روبلوكس')
        .addStringOption(opt =>
          opt.setName('user')
            .setDescription('Roblox username or profile URL')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('compare')
        .setDescription('Compare two Roblox accounts side-by-side | مقارنة بين حسابين روبلوكس')
        .addStringOption(opt =>
          opt.setName('user1')
            .setDescription('First Roblox username')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('user2')
            .setDescription('Second Roblox username')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('game')
        .setDescription('Lookup Roblox experience by Place ID or game URL | معلومات لعبة روبلوكس')
        .addStringOption(opt =>
          opt.setName('query')
            .setDescription('Place ID or Roblox game URL')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('group')
        .setDescription('Lookup Roblox group by Group ID or URL | معلومات مجموعة روبلوكس')
        .addStringOption(opt =>
          opt.setName('query')
            .setDescription('Group ID or Roblox group URL')
            .setRequired(true)
        )
    ),
  category: 'roblox',
  descriptionAr: 'حزمة أوامر روبلوكس الشاملة (بروفايل، أفتار، مقارنة، ألعاب، مجموعات)',
  exampleUsage: '/roblox user username:builderman',
  async execute(interaction: ChatInputCommandInteraction) {
    const settings = db.getGuildSettings(interaction.guildId || '');
    const lang = getLang(settings.language);
    const isAr = settings.language === 'ar';

    if (settings.admin_only_commands && !interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: lang.common.permissionDenied,
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'user') {
      const input = interaction.options.getString('username', true);
      const resolveRes = await robloxService.resolveUser(input);

      if (!resolveRes.success || !resolveRes.user) {
        if (resolveRes.reason === 'NOT_FOUND') {
          await interaction.editReply({ content: lang.roblox.userNotFound });
        } else {
          await interaction.editReply({ content: lang.roblox.apiUnavailable });
        }
        return;
      }

      const userId = resolveRes.user.id;
      const [detailsRes, thumbs, counts] = await Promise.all([
        robloxService.getUserDetails(userId),
        robloxService.getUserThumbnails(userId),
        robloxService.getUserCounts(userId)
      ]);

      const profile = detailsRes.data || {
        id: userId,
        name: resolveRes.user.name,
        displayName: resolveRes.user.displayName,
        description: '',
        created: new Date().toISOString(),
        isBanned: false
      };

      const accountAge = robloxService.calculateAccountAge(profile.created, settings.language);
      const createdDateFormatted = new Date(profile.created).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const embed = new EmbedBuilder()
        .setTitle(`${profile.displayName} (@${profile.name})`)
        .setURL(`https://www.roblox.com/users/${profile.id}/profile`)
        .setColor(CONFIG.COLORS.ROBLOX as any)
        .setThumbnail(thumbs.headshot || 'https://images.rbxcdn.com/2642ec09c6ebf8b6b21c43555db1b326.png')
        .addFields(
          { name: '🆔 User ID', value: `\`${profile.id}\``, inline: true },
          { name: `📅 ${lang.roblox.createdDate}`, value: createdDateFormatted, inline: true },
          { name: `⏳ ${lang.roblox.accountAge}`, value: accountAge, inline: true },
          { name: `👥 ${lang.roblox.friendsCount}`, value: counts.friends === 'N/A' ? `*${lang.roblox.privateInfo}*` : `\`${counts.friends.toLocaleString()}\``, inline: true },
          { name: `🌟 ${lang.roblox.followersCount}`, value: counts.followers === 'N/A' ? `*${lang.roblox.privateInfo}*` : `\`${counts.followers.toLocaleString()}\``, inline: true },
          { name: `➡️ ${lang.roblox.followingCount}`, value: counts.following === 'N/A' ? `*${lang.roblox.privateInfo}*` : `\`${counts.following.toLocaleString()}\``, inline: true }
        )
        .setFooter({ text: `${settings.bot_name} • Roblox Community Hub` })
        .setTimestamp();

      if (profile.description && profile.description.trim()) {
        const bio = profile.description.length > 350 ? profile.description.substring(0, 347) + '...' : profile.description;
        embed.setDescription(`📝 **${isAr ? 'الوصف (Bio):' : 'Bio:'}**\n\`\`\`\n${bio}\n\`\`\``);
      }

      if (profile.isBanned) {
        embed.addFields({ name: '⚠️ ' + (isAr ? 'حالة الحساب' : 'Account Status'), value: '🚫 **Banned**', inline: true });
      }

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(lang.roblox.btnProfile)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.roblox.com/users/${profile.id}/profile`)
          .setEmoji('🌐'),
        new ButtonBuilder()
          .setCustomId(`roblox_avatar_full_${profile.id}`)
          .setLabel(lang.roblox.btnAvatarFull)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🧍'),
        new ButtonBuilder()
          .setCustomId(`roblox_groups_${profile.id}_0`)
          .setLabel(lang.roblox.btnGroups)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👥')
      );

      await interaction.editReply({ embeds: [embed], components: [buttons] });
      return;
    }

    if (subcommand === 'avatar') {
      const input = interaction.options.getString('user', true);
      const resolveRes = await robloxService.resolveUser(input);

      if (!resolveRes.success || !resolveRes.user) {
        await interaction.editReply({
          content: resolveRes.reason === 'NOT_FOUND' ? lang.roblox.userNotFound : lang.roblox.apiUnavailable
        });
        return;
      }

      const userId = resolveRes.user.id;
      const thumbs = await robloxService.getUserThumbnails(userId);

      const embed = new EmbedBuilder()
        .setTitle(`🧍 ${resolveRes.user.displayName} (@${resolveRes.user.name}) • Avatar`)
        .setColor(CONFIG.COLORS.ROBLOX as any)
        .setImage(thumbs.fullBody || thumbs.headshot || null)
        .setFooter({ text: `${settings.bot_name} • Roblox Avatar Viewer` })
        .setTimestamp();

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`roblox_toggle_head_${userId}`)
          .setLabel(lang.roblox.btnAvatarHead)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👤'),
        new ButtonBuilder()
          .setCustomId(`roblox_toggle_body_${userId}`)
          .setLabel(lang.roblox.btnAvatarFull)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🧍')
      );

      await interaction.editReply({ embeds: [embed], components: [buttons] });
      return;
    }

    if (subcommand === 'compare') {
      const user1Input = interaction.options.getString('user1', true);
      const user2Input = interaction.options.getString('user2', true);

      const [res1, res2] = await Promise.all([
        robloxService.resolveUser(user1Input),
        robloxService.resolveUser(user2Input)
      ]);

      if (!res1.success || !res1.user || !res2.success || !res2.user) {
        await interaction.editReply({
          content: `❌ ${isAr ? 'تعذر العثور على أحد الحسابين أو كلاهما. تأكد من صحة الأسماء.' : 'Could not resolve one or both users. Please verify usernames.'}`
        });
        return;
      }

      const [details1, details2, counts1, counts2, thumbs1, thumbs2] = await Promise.all([
        robloxService.getUserDetails(res1.user.id),
        robloxService.getUserDetails(res2.user.id),
        robloxService.getUserCounts(res1.user.id),
        robloxService.getUserCounts(res2.user.id),
        robloxService.getUserThumbnails(res1.user.id),
        robloxService.getUserThumbnails(res2.user.id)
      ]);

      const age1 = details1.data?.created ? robloxService.calculateAccountAge(details1.data.created, settings.language) : 'N/A';
      const age2 = details2.data?.created ? robloxService.calculateAccountAge(details2.data.created, settings.language) : 'N/A';

      const embed = new EmbedBuilder()
        .setTitle(`⚔️ Roblox Comparison: ${res1.user.displayName} VS ${res2.user.displayName}`)
        .setColor(CONFIG.COLORS.PRIMARY as any)
        .addFields(
          {
            name: `🔴 ${res1.user.displayName} (@${res1.user.name})`,
            value: [
              `• **ID:** \`${res1.user.id}\``,
              `• **${lang.roblox.createdDate}:** ${details1.data?.created ? details1.data.created.split('T')[0] : 'N/A'}`,
              `• **${lang.roblox.accountAge}:** ${age1}`,
              `• **${lang.roblox.friendsCount}:** \`${counts1.friends}\``,
              `• **${lang.roblox.followersCount}:** \`${counts1.followers}\``
            ].join('\n'),
            inline: true
          },
          {
            name: `🔵 ${res2.user.displayName} (@${res2.user.name})`,
            value: [
              `• **ID:** \`${res2.user.id}\``,
              `• **${lang.roblox.createdDate}:** ${details2.data?.created ? details2.data.created.split('T')[0] : 'N/A'}`,
              `• **${lang.roblox.accountAge}:** ${age2}`,
              `• **${lang.roblox.friendsCount}:** \`${counts2.friends}\``,
              `• **${lang.roblox.followersCount}:** \`${counts2.followers}\``
            ].join('\n'),
            inline: true
          }
        )
        .setThumbnail(thumbs1.headshot || null)
        .setFooter({ text: `${settings.bot_name} • Head-to-Head Comparison` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'game') {
      const query = interaction.options.getString('query', true);
      const res = await robloxService.getGameData(query);

      if (!res.success || !res.game) {
        await interaction.editReply({
          content: res.reason === 'NOT_FOUND' ? lang.roblox.gameNotFound : lang.roblox.apiUnavailable
        });
        return;
      }

      const g = res.game;
      const embed = new EmbedBuilder()
        .setTitle(`🎮 ${g.name}`)
        .setURL(`https://www.roblox.com/games/${g.rootPlaceId}`)
        .setColor(CONFIG.COLORS.ROBLOX as any)
        .setThumbnail(g.iconUrl || null)
        .addFields(
          { name: isAr ? '👑 المطوّر' : '👑 Creator', value: `${g.creator?.name || 'N/A'} (\`${g.creator?.type || 'User'}\`)`, inline: true },
          { name: isAr ? '👥 اللاعبون الحاليون' : '👥 Active Players', value: `\`${g.playing.toLocaleString()}\``, inline: true },
          { name: isAr ? '👁️ إجمالي الزيارات' : '👁️ Total Visits', value: `\`${g.visits.toLocaleString()}\``, inline: true },
          { name: isAr ? '🚪 الحد الأقصى للمخدم' : '🚪 Server Capacity', value: `\`${g.maxPlayers}\``, inline: true },
          { name: '🆔 Place ID', value: `\`${g.rootPlaceId}\``, inline: true }
        )
        .setFooter({ text: `${settings.bot_name} • Roblox Game Explorer` })
        .setTimestamp();

      if (g.description && g.description.trim()) {
        const desc = g.description.length > 250 ? g.description.substring(0, 247) + '...' : g.description;
        embed.setDescription(`📜 **${isAr ? 'عن التجربة:' : 'About:'}**\n\`\`\`\n${desc}\n\`\`\``);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(isAr ? '▶️ فتح التجربة في روبلوكس' : '▶️ Play on Roblox')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.roblox.com/games/${g.rootPlaceId}`)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }

    if (subcommand === 'group') {
      const query = interaction.options.getString('query', true);
      const res = await robloxService.getGroupData(query);

      if (!res.success || !res.group) {
        await interaction.editReply({
          content: res.reason === 'NOT_FOUND' ? lang.roblox.groupNotFound : lang.roblox.apiUnavailable
        });
        return;
      }

      const grp = res.group;
      const embed = new EmbedBuilder()
        .setTitle(`👥 ${grp.name}`)
        .setURL(`https://www.roblox.com/groups/${grp.id}`)
        .setColor(CONFIG.COLORS.ROBLOX as any)
        .setThumbnail(grp.iconUrl || null)
        .addFields(
          { name: isAr ? '👑 المالك' : '👑 Owner', value: grp.owner ? `${grp.owner.displayName} (@${grp.owner.username})` : (isAr ? 'لا يوجد مالك' : 'None'), inline: true },
          { name: isAr ? '📊 عدد الأعضاء' : '📊 Member Count', value: `\`${grp.memberCount.toLocaleString()}\``, inline: true },
          { name: '🆔 Group ID', value: `\`${grp.id}\``, inline: true }
        )
        .setFooter({ text: `${settings.bot_name} • Roblox Group Directory` })
        .setTimestamp();

      if (grp.description && grp.description.trim()) {
        const desc = grp.description.length > 300 ? grp.description.substring(0, 297) + '...' : grp.description;
        embed.setDescription(`📝 **${isAr ? 'وصف المجموعة:' : 'Description:'}**\n\`\`\`\n${desc}\n\`\`\``);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(isAr ? '🌐 زيارة المجموعة' : '🌐 Visit Group')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://www.roblox.com/groups/${grp.id}`)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }
  }
};
