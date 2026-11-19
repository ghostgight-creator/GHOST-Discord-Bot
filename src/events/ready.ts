import { ActivityType, Client, REST, Routes } from 'discord.js';
import { Command } from '../types';

export async function onReady(client: Client, commands: Map<string, Command>): Promise<void> {
  console.log(`=======================================================`);
  console.log(`👻 GHOST Bot is ONLINE! Logged in as: ${client.user?.tag} (${client.user?.id})`);
  console.log(`🌐 Total Guilds Connected: ${client.guilds.cache.size}`);
  console.log(`=======================================================`);

  // Set Rich Presence
  client.user?.setPresence({
    activities: [
      {
        name: '🎮 Roblox & Community | /help',
        type: ActivityType.Playing
      }
    ],
    status: 'online'
  });

  // Global Slash Command Registration
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID || client.user?.id;

  if (token && clientId) {
    const rest = new REST({ version: '10' }).setToken(token);
    const commandsData = Array.from(commands.values()).map(c => c.data.toJSON());

    try {
      console.log(`🔄 [Global Commands] Registering ${commandsData.length} Slash Commands globally...`);
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandsData }
      );
      console.log(`✅ [Global Commands] Successfully deployed to all Discord servers!`);
    } catch (err: any) {
      console.error(`❌ [Global Commands Error] Failed to register slash commands:`, err);
    }
  }
}
