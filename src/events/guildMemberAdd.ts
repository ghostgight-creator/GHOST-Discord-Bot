import { GuildMember, TextChannel } from 'discord.js';
import { db } from '../database';
import { WelcomeService } from '../services/welcomeService';

export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  const guild = member.guild;
  const settings = db.getGuildSettings(guild.id);

  // 1. Auto-Role
  if (settings.auto_role_id) {
    const role = guild.roles.cache.get(settings.auto_role_id);
    if (role) {
      await member.roles.add(role).catch(err => {
        console.error(`[AutoRole Error] Failed to assign role to ${member.user.tag}:`, err);
      });
    }
  }

  // 2. Welcome Card
  if (settings.welcome_enabled && settings.welcome_channel_id) {
    const channel = guild.channels.cache.get(settings.welcome_channel_id) as TextChannel | undefined;
    if (channel) {
      const payload = WelcomeService.buildWelcomePayload(guild, member);
      await channel.send(payload).catch(err => {
        console.error(`[Welcome Error] Failed to send welcome message:`, err);
      });
    }
  }
}
