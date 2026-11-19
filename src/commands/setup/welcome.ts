import { 
  ChannelType, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  SlashCommandBuilder 
} from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { WelcomeService } from '../../services/welcomeService';
import { getLang } from '../../services/translationService';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure and preview welcome system | إعداد ومعاينة بطاقة الترحيب')
    .addSubcommand(sub =>
      sub.setName('preview')
        .setDescription('Previews the welcome card and rules button | معاينة بطاقة الترحيب')
    )
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Configure custom welcome message and rules | تخصيص رسالة الترحيب')
        .addStringOption(opt =>
          opt.setName('message')
            .setDescription('Custom message with {user}, {server}, {memberCount}')
            .setRequired(false)
        )
        .addChannelOption(opt =>
          opt.setName('rules_channel')
            .setDescription('Rules channel linked on the welcome button | روم القوانين')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addChannelOption(opt =>
          opt.setName('welcome_channel')
            .setDescription('Channel where welcome cards will be sent | روم الترحيب')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addBooleanOption(opt =>
          opt.setName('enabled')
            .setDescription('Enable or disable the welcome system | تفعيل أو تعطيل الترحيب')
            .setRequired(false)
        )
    ),
  category: 'setup',
  descriptionAr: 'تخصيص ومعاينة نظام الترحيب بالأعضاء الجدد',
  exampleUsage: '/welcome preview أو /welcome setup message:أهلاً {user}',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const subcommand = interaction.options.getSubcommand();
    const settings = db.getGuildSettings(guild.id);
    const lang = getLang(settings.language);

    if (subcommand === 'preview') {
      const payload = WelcomeService.buildWelcomePayload(
        guild, 
        { user: interaction.user, guild }, 
        true
      );
      await interaction.reply({ ...payload, ephemeral: true });
      return;
    }

    if (subcommand === 'setup') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
          content: lang.common.permissionDenied,
          ephemeral: true
        });
        return;
      }

      const message = interaction.options.getString('message');
      const rulesChannel = interaction.options.getChannel('rules_channel');
      const welcomeChannel = interaction.options.getChannel('welcome_channel');
      const enabled = interaction.options.getBoolean('enabled');

      const updates: any = {};
      if (message !== null) updates.welcome_message = message;
      if (rulesChannel !== null) updates.rules_channel_id = rulesChannel.id;
      if (welcomeChannel !== null) updates.welcome_channel_id = welcomeChannel.id;
      if (enabled !== null) updates.welcome_enabled = enabled ? 1 : 0;

      db.updateGuildSettings(guild.id, updates);

      await interaction.reply({
        content: `✅ ${lang.setup.updated}\n${message ? `📝 **الرسالة:** ${message}\n` : ''}${rulesChannel ? `📜 **روم القوانين:** <#${rulesChannel.id}>\n` : ''}${welcomeChannel ? `👋 **روم الترحيب:** <#${welcomeChannel.id}>\n` : ''}`,
        ephemeral: true
      });
    }
  }
};
