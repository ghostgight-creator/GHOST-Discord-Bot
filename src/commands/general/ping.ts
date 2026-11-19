import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { db } from '../../database';
import { CONFIG } from '../../config';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Displays bot latency and Discord API heartbeat | فحص سرعة استجابة البوت'),
  category: 'general',
  descriptionAr: 'فحص سرعة استجابة البوت والبنج',
  exampleUsage: '/ping',
  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    const settings = db.getGuildSettings(interaction.guildId || '');

    const embed = new EmbedBuilder()
      .setTitle(`🏓 ${settings.bot_name} - Ping Status`)
      .setColor(settings.embed_color as any || CONFIG.COLORS.PRIMARY)
      .addFields(
        { name: '⚡ Roundtrip Latency', value: `\`${roundtrip}ms\``, inline: true },
        { name: '💓 WebSocket Heartbeat', value: `\`${wsPing}ms\``, inline: true }
      )
      .setFooter({ text: `${settings.bot_name} • Operational` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
