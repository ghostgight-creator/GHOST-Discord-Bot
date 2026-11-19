import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  GuildMember, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { CONFIG } from '../../config';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Displays high quality avatar of yourself or a member | عرض صورة الأفتار')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The member whose avatar you want to view | العضو المراد عرض صورته')
        .setRequired(false)
    ),
  category: 'general',
  descriptionAr: 'عرض أفتار العضو بجودة عالية مع خيار صورة السيرفر',
  exampleUsage: '/avatar target:@username',
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild?.members.cache.get(targetUser.id) as GuildMember | undefined;

    const globalAvatarUrl = targetUser.displayAvatarURL({ size: 1024, extension: 'png' });
    const serverAvatarUrl = member?.avatar ? member.avatarURL({ size: 1024, extension: 'png' }) : null;

    const settings = db.getGuildSettings(interaction.guildId || '');

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar • ${targetUser.username}`)
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .setImage(serverAvatarUrl || globalAvatarUrl)
      .setDescription(
        serverAvatarUrl 
          ? (settings.language === 'ar' ? 'يملك هذا العضو أفتار مخصص داخل السيرفر وأفتار عام.' : 'This member has both a server-specific and a global avatar.')
          : null
      )
      .setFooter({ text: `${settings.bot_name} • High Resolution Viewer` })
      .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>();

    buttons.addComponents(
      new ButtonBuilder()
        .setLabel(settings.language === 'ar' ? 'فتح الصورة الأصلية' : 'Open Full Image')
        .setStyle(ButtonStyle.Link)
        .setURL(serverAvatarUrl || globalAvatarUrl)
        .setEmoji('🔗')
    );

    if (serverAvatarUrl) {
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`avatar_switch_${targetUser.id}_server`)
          .setLabel(settings.language === 'ar' ? 'صورة السيرفر' : 'Server Avatar')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏰'),
        new ButtonBuilder()
          .setCustomId(`avatar_switch_${targetUser.id}_global`)
          .setLabel(settings.language === 'ar' ? 'الصورة العامة' : 'Global Avatar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🌐')
      );
    }

    await interaction.reply({ embeds: [embed], components: [buttons] });
  }
};
