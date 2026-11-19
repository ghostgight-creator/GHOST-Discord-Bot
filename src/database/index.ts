import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { GuildSettings, TicketRecord, WarningRecord } from '../types';
import { CONFIG } from '../config';

class DatabaseService {
  private db: DatabaseType;

  constructor(dbPath?: string) {
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const resolvedPath = dbPath || path.join(dataDir, 'ghost.sqlite');
    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
  }

  private initTables(): void {
    // 1. Guild Settings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        language TEXT DEFAULT 'ar',
        welcome_channel_id TEXT DEFAULT NULL,
        welcome_message TEXT DEFAULT NULL,
        rules_channel_id TEXT DEFAULT NULL,
        welcome_enabled INTEGER DEFAULT 1,
        log_channel_id TEXT DEFAULT NULL,
        ticket_category_id TEXT DEFAULT NULL,
        ticket_support_role_id TEXT DEFAULT NULL,
        ticket_admin_role_id TEXT DEFAULT NULL,
        auto_role_id TEXT DEFAULT NULL,
        admin_only_commands INTEGER DEFAULT 0,
        embed_color TEXT DEFAULT '${CONFIG.COLORS.PRIMARY}',
        bot_name TEXT DEFAULT '${CONFIG.BOT_NAME}'
      )
    `);

    // 2. Tickets
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number INTEGER NOT NULL,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        ticket_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        claimed_by TEXT DEFAULT NULL,
        created_at TEXT NOT NULL,
        closed_at TEXT DEFAULT NULL,
        closed_by TEXT DEFAULT NULL,
        close_reason TEXT DEFAULT NULL
      )
    `);

    // 3. Warnings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }

  // Guild Settings Management
  public getGuildSettings(guildId: string): GuildSettings {
    const stmt = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
    const row = stmt.get(guildId) as GuildSettings | undefined;

    if (!row) {
      const defaultSettings: GuildSettings = {
        guild_id: guildId,
        language: 'ar',
        welcome_channel_id: null,
        welcome_message: CONFIG.DEFAULT_WELCOME_MESSAGE,
        rules_channel_id: null,
        welcome_enabled: 1,
        log_channel_id: null,
        ticket_category_id: null,
        ticket_support_role_id: null,
        ticket_admin_role_id: null,
        auto_role_id: null,
        admin_only_commands: 0,
        embed_color: CONFIG.COLORS.PRIMARY,
        bot_name: CONFIG.BOT_NAME
      };

      const insert = this.db.prepare(`
        INSERT INTO guild_settings (
          guild_id, language, welcome_channel_id, welcome_message, rules_channel_id,
          welcome_enabled, log_channel_id, ticket_category_id, ticket_support_role_id,
          ticket_admin_role_id, auto_role_id, admin_only_commands, embed_color, bot_name
        ) VALUES (
          @guild_id, @language, @welcome_channel_id, @welcome_message, @rules_channel_id,
          @welcome_enabled, @log_channel_id, @ticket_category_id, @ticket_support_role_id,
          @ticket_admin_role_id, @auto_role_id, @admin_only_commands, @embed_color, @bot_name
        )
      `);
      insert.run(defaultSettings);
      return defaultSettings;
    }

    return row;
  }

  public updateGuildSettings(guildId: string, updates: Partial<GuildSettings>): GuildSettings {
    this.getGuildSettings(guildId); // Ensure exists

    const fields = Object.keys(updates)
      .filter(key => key !== 'guild_id')
      .map(key => `${key} = @${key}`)
      .join(', ');

    if (!fields) return this.getGuildSettings(guildId);

    const stmt = this.db.prepare(`UPDATE guild_settings SET ${fields} WHERE guild_id = @guild_id`);
    stmt.run({ ...updates, guild_id: guildId });

    return this.getGuildSettings(guildId);
  }

  // Tickets Management
  public getNextTicketNumber(guildId: string): number {
    const stmt = this.db.prepare('SELECT MAX(ticket_number) as maxNum FROM tickets WHERE guild_id = ?');
    const result = stmt.get(guildId) as { maxNum: number | null } | undefined;
    return (result?.maxNum ?? 0) + 1;
  }

  public createTicket(data: Omit<TicketRecord, 'id'>): TicketRecord {
    const stmt = this.db.prepare(`
      INSERT INTO tickets (
        ticket_number, guild_id, channel_id, user_id, ticket_type,
        reason, status, claimed_by, created_at
      ) VALUES (
        @ticket_number, @guild_id, @channel_id, @user_id, @ticket_type,
        @reason, @status, @claimed_by, @created_at
      )
    `);
    const info = stmt.run(data);
    return { ...data, id: Number(info.lastInsertRowid) };
  }

  public getTicketByChannel(channelId: string): TicketRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM tickets WHERE channel_id = ?');
    return stmt.get(channelId) as TicketRecord | undefined;
  }

  public getActiveTicket(guildId: string, userId: string, ticketType?: string): TicketRecord | undefined {
    if (ticketType) {
      const stmt = this.db.prepare(
        "SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND ticket_type = ? AND status != 'closed'"
      );
      return stmt.get(guildId, userId, ticketType) as TicketRecord | undefined;
    }
    const stmt = this.db.prepare(
      "SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status != 'closed'"
    );
    return stmt.get(guildId, userId) as TicketRecord | undefined;
  }

  public updateTicket(channelId: string, updates: Partial<TicketRecord>): void {
    const fields = Object.keys(updates)
      .filter(key => key !== 'channel_id' && key !== 'id')
      .map(key => `${key} = @${key}`)
      .join(', ');

    if (!fields) return;

    const stmt = this.db.prepare(`UPDATE tickets SET ${fields} WHERE channel_id = @channel_id`);
    stmt.run({ ...updates, channel_id: channelId });
  }

  // Warnings Management
  public addWarning(guildId: string, userId: string, moderatorId: string, reason: string): WarningRecord {
    const createdAt = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(guildId, userId, moderatorId, reason, createdAt);
    return {
      id: Number(info.lastInsertRowid),
      guild_id: guildId,
      user_id: userId,
      moderator_id: moderatorId,
      reason,
      created_at: createdAt
    };
  }

  public getWarnings(guildId: string, userId: string): WarningRecord[] {
    const stmt = this.db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC');
    return stmt.all(guildId, userId) as WarningRecord[];
  }

  public clearWarnings(guildId: string, userId: string): number {
    const stmt = this.db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?');
    const info = stmt.run(guildId, userId);
    return info.changes;
  }

  public close(): void {
    this.db.close();
  }
}

export const db = new DatabaseService();
export { DatabaseService };
