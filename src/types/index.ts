import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  SlashCommandOptionsOnlyBuilder, 
  SlashCommandSubcommandsOnlyBuilder 
} from 'discord.js';

export type SupportedLanguage = 'ar' | 'en';

export interface GuildSettings {
  guild_id: string;
  language: SupportedLanguage;
  welcome_channel_id: string | null;
  welcome_message: string;
  rules_channel_id: string | null;
  welcome_enabled: number; // 0 or 1
  log_channel_id: string | null;
  ticket_category_id: string | null;
  ticket_support_role_id: string | null;
  ticket_admin_role_id: string | null;
  auto_role_id: string | null;
  admin_only_commands: number; // 0 or 1
  embed_color: string;
  bot_name: string;
}

export type TicketType = 'support' | 'report' | 'admin' | 'inquiry';

export interface TicketRecord {
  id?: number;
  ticket_number: number;
  guild_id: string;
  channel_id: string;
  user_id: string;
  ticket_type: TicketType;
  reason: string;
  status: 'open' | 'claimed' | 'closed';
  claimed_by: string | null;
  created_at: string;
  closed_at: string | null;
  closed_by: string | null;
  close_reason: string | null;
}

export interface WarningRecord {
  id?: number;
  guild_id: string;
  user_id: string;
  moderator_id: string;
  reason: string;
  created_at: string;
}

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  category: 'general' | 'setup' | 'tickets' | 'roblox' | 'moderation';
  descriptionAr: string;
  exampleUsage: string;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
