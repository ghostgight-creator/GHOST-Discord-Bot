import { 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { CONFIG } from '../../config';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays command list categorized by module | دليل واستعراض الأوامر'),
  category: 'general',
  descriptionAr: 'قائمة المساعدة ودليل استخدام أوامر البوت',
  exampleUsage: '/help',
  async execute(interaction: ChatInputCommandInteraction) {
    const settings = db.getGuildSettings(interaction.guildId || '');
    const isAr = settings.language === 'ar';
    const member = interaction.memberPermissions;

    const isAdmin = member?.has(PermissionFlagsBits.Administrator) || member?.has(PermissionFlagsBits.ManageGuild);
    const isMod = isAdmin || member?.has(PermissionFlagsBits.ModerateMembers) || member?.has(PermissionFlagsBits.ManageMessages);

    const embed = new EmbedBuilder()
      .setTitle(`📖 ${settings.bot_name} • ${isAr ? 'دليل الأوامر والمساعدة' : 'Command Guide & Help'}`)
      .setDescription(
        isAr 
          ? `مرحباً بك في قائمة أوامر **${settings.bot_name}**! جميع الأوامر تدعم نظام السلاش (\`/\`). يتم عرض الأقسام وفقاً لمستوى صلاحياتك في السيرفر:`
          : `Welcome to **${settings.bot_name}** help center! All commands utilize Discord Slash Commands (\`/\`). Showing commands matching your permissions:`
      )
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: `${settings.bot_name} • Gaming & Community Bot` })
      .setTimestamp();

    // 1. General Commands
    embed.addFields({
      name: isAr ? '🎮 الأوامر العامة (General)' : '🎮 General Commands',
      value: [
        `• \`/ping\` - ${isAr ? 'فحص سرعة استجابة البوت' : 'Check bot latency'} *(مثال: \`/ping\`)*`,
        `• \`/avatar\` - ${isAr ? 'عرض صورة البروفايل أو السيرفر' : 'View profile/server avatar'} *(مثال: \`/avatar target:@user\`)*`,
        `• \`/banner\` - ${isAr ? 'عرض بانر العضو' : 'View user banner'} *(مثال: \`/banner target:@user\`)*`,
        `• \`/userinfo\` - ${isAr ? 'معلومات العضو والانضمام' : 'Detailed user info'} *(مثال: \`/userinfo target:@user\`)*`,
        `• \`/serverinfo\` - ${isAr ? 'إحصائيات ومعلومات السيرفر' : 'Server details & stats'} *(مثال: \`/serverinfo\`)*`,
        `• \`/welcome preview\` - ${isAr ? 'معاينة بطاقة الترحيب' : 'Preview welcome card'} *(مثال: \`/welcome preview\`)*`
      ].join('\n'),
      inline: false
    });

    // 2. Roblox Commands
    embed.addFields({
      name: isAr ? '🟥 قسم روبلوكس (Roblox Features)' : '🟥 Roblox Commands',
      value: [
        `• \`/roblox user\` - ${isAr ? 'فحص حساب روبلوكس وبطاقة تفصيلية' : 'Look up user profile'} *(مثال: \`/roblox user username:builderman\`)*`,
        `• \`/roblox avatar\` - ${isAr ? 'عرض أفتار روبلوكس بالكامل أو الرأس' : 'Roblox avatar headshot/body'} *(مثال: \`/roblox avatar user:builderman\`)*`,
        `• \`/roblox compare\` - ${isAr ? 'مقارنة بين حسابين روبلوكس جنباً لجنب' : 'Compare 2 Roblox accounts'} *(مثال: \`/roblox compare user1:a user2:b\`)*`,
        `• \`/roblox game\` - ${isAr ? 'معلومات اللعبة أو Place ID واللاعبين' : 'Roblox game & active players'} *(مثال: \`/roblox game query:1818\`)*`,
        `• \`/roblox group\` - ${isAr ? 'معلومات المجموعة وشعارها وأعضائها' : 'Roblox group information'} *(مثال: \`/roblox group query:2\`)*`
      ].join('\n'),
      inline: false
    });

    // 3. Ticket System
    embed.addFields({
      name: isAr ? '🎫 نظام التذاكر (Tickets)' : '🎫 Ticket System',
      value: [
        `• \`/ticket panel\` - ${isAr ? 'إرسال لوحة فتح التذاكر (إدارة)' : 'Deploy ticket panel (Staff)'} *(مثال: \`/ticket panel\`)*`
      ].join('\n'),
      inline: false
    });

    // 4. Moderation Commands (Staff only)
    if (isMod) {
      embed.addFields({
        name: isAr ? '🛡️ أوامر الإشراف والإدارة (Moderation)' : '🛡️ Moderation Commands',
        value: [
          `• \`/warn\` - ${isAr ? 'تحذير عضو مع تسجيل السبب' : 'Warn member with reason'} *(مثال: \`/warn target:@user reason:مخالفة\`)*`,
          `• \`/warnings\` - ${isAr ? 'عرض سجل تحذيرات عضو' : 'View user warnings'} *(مثال: \`/warnings target:@user\`)*`,
          `• \`/timeout\` - ${isAr ? 'إسكات مؤقت لعضو بالدقائق' : 'Timeout member'} *(مثال: \`/timeout target:@user minutes:10 reason:spam\`)*`,
          `• \`/kick\` - ${isAr ? 'طرد عضو من السيرفر' : 'Kick member from server'} *(مثال: \`/kick target:@user reason:إزعاج\`)*`,
          `• \`/ban\` - ${isAr ? 'حظر عضو نهائياً من السيرفر' : 'Ban member from server'} *(مثال: \`/ban target:@user reason:تخريب\`)*`,
          `• \`/unban\` - ${isAr ? 'فك الحظر عن طريق الآيدي' : 'Unban member by ID'} *(مثال: \`/unban user_id:123456789\`)*`,
          `• \`/clear\` - ${isAr ? 'مسح عدد محدد من الرسائل' : 'Purge messages'} *(مثال: \`/clear amount:20\`)*`
        ].join('\n'),
        inline: false
      });
    }

    // 5. Setup & Administration (Admins only)
    if (isAdmin) {
      embed.addFields({
        name: isAr ? '⚙️ أوامر التثبيت والإعداد (Setup & Admin)' : '⚙️ Setup & Admin',
        value: [
          `• \`/setup\` - ${isAr ? 'فتح لوحة الإعدادات الشاملة (لغة، رومات، رتب)' : 'Interactive Bot Setup Panel'} *(مثال: \`/setup\`)*`,
          `• \`/welcome setup\` - ${isAr ? 'تخصيص رسالة الترحيب وروم القوانين' : 'Configure welcome message & rules'} *(مثال: \`/welcome setup\`)*`
        ].join('\n'),
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
