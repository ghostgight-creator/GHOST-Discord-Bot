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
import { CONFIG } from '../../config';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Displays profile banner of yourself or a member | عرض بانر البروفايل')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The member whose banner you want to view | العضو المراد عرض بانره')
        .setRequired(false)
    ),
  category: 'general',
  descriptionAr: 'عرض بانر العضو أو توضيح عدم توفر بانر',
  exampleUsage: '/banner target:@username',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('target') || interaction.user;

    const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true });
    const bannerUrl = fullUser.bannerURL({ size: 2048, extension: 'png' });

    const settings = db.getGuildSettings(interaction.guildId || '');

    if (!bannerUrl) {
      const noBannerEmbed = new EmbedBuilder()
        .setTitle(`🎨 Banner • ${fullUser.username}`)
        .setDescription(
          settings.language === 'ar'
            ? `⚠️ **هذا العضو لا يمتلك بانر مخصص في حسابه.**`
            : `⚠️ **This user does not have a custom profile banner.**`
        )
        .setColor(CONFIG.COLORS.WARNING as any)
        .setThumbnail(fullUser.displayAvatarURL())
        .setTimestamp();

      await interaction.editReply({ embeds: [noBannerEmbed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎨 Banner • ${fullUser.username}`)
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .setImage(bannerUrl)
      .setFooter({ text: `${settings.bot_name} • High Resolution Banner` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(settings.language === 'ar' ? 'فتح البانر الأصلي' : 'Open Full Banner')
        .setStyle(ButtonStyle.Link)
        .setURL(bannerUrl)
        .setEmoji('🔗')
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
