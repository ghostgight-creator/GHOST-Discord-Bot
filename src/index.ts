import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { Command } from './types';
import { onReady } from './events/ready';
import { onInteractionCreate } from './events/interactionCreate';
import { onGuildMemberAdd } from './events/guildMemberAdd';

// Import All Commands
import { command as pingCmd } from './commands/general/ping';
import { command as avatarCmd } from './commands/general/avatar';
import { command as bannerCmd } from './commands/general/banner';
import { command as userinfoCmd } from './commands/general/userinfo';
import { command as serverinfoCmd } from './commands/general/serverinfo';
import { command as helpCmd } from './commands/general/help';

import { command as setupCmd } from './commands/setup/setup';
import { command as welcomeCmd } from './commands/setup/welcome';

import { command as ticketCmd } from './commands/tickets/ticket';
import { command as robloxCmd } from './commands/roblox/roblox';

import { command as warnCmd } from './commands/moderation/warn';
import { command as warningsCmd } from './commands/moderation/warnings';
import { command as timeoutCmd } from './commands/moderation/timeout';
import { command as kickCmd } from './commands/moderation/kick';
import { command as banCmd } from './commands/moderation/ban';
import { command as unbanCmd } from './commands/moderation/unban';
import { command as clearCmd } from './commands/moderation/clear';

// Initialize Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ]
});

// Register Commands Map
const commands = new Map<string, Command>();
const commandList: Command[] = [
  pingCmd,
  avatarCmd,
  bannerCmd,
  userinfoCmd,
  serverinfoCmd,
  helpCmd,
  setupCmd,
  welcomeCmd,
  ticketCmd,
  robloxCmd,
  warnCmd,
  warningsCmd,
  timeoutCmd,
  kickCmd,
  banCmd,
  unbanCmd,
  clearCmd
];

for (const cmd of commandList) {
  commands.set(cmd.data.name, cmd);
}

// Bind Events
client.once('clientReady', () => onReady(client, commands));
client.on('interactionCreate', (interaction) => onInteractionCreate(interaction, commands));
client.on('guildMemberAdd', (member) => onGuildMemberAdd(member));

// Error Handlers
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

// HTTP Health Check Server (For cloud hosting platforms like Render/Koyeb)
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('👻 GHOST Discord Bot is ONLINE 24/7!');
});
server.listen(port, () => {
  console.log(`🌐 HTTP Server listening on port ${port}`);
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token || token.includes('ضع_توكن')) {
  console.error('❌ DISCORD_TOKEN is missing or not set in .env file!');
  process.exit(1);
}

client.login(token).catch(err => {
  console.error('❌ Failed to login to Discord! Check your token and intents:');
  console.error(err);
});
