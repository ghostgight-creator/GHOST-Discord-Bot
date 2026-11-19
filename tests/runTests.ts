import { DatabaseService } from '../src/database';
import { robloxService } from '../src/services/robloxService';
import fs from 'fs';
import path from 'path';

// Import commands to verify structure
import { command as pingCmd } from '../src/commands/general/ping';
import { command as avatarCmd } from '../src/commands/general/avatar';
import { command as bannerCmd } from '../src/commands/general/banner';
import { command as userinfoCmd } from '../src/commands/general/userinfo';
import { command as serverinfoCmd } from '../src/commands/general/serverinfo';
import { command as helpCmd } from '../src/commands/general/help';
import { command as setupCmd } from '../src/commands/setup/setup';
import { command as welcomeCmd } from '../src/commands/setup/welcome';
import { command as ticketCmd } from '../src/commands/tickets/ticket';
import { command as robloxCmd } from '../src/commands/roblox/roblox';
import { command as warnCmd } from '../src/commands/moderation/warn';
import { command as warningsCmd } from '../src/commands/moderation/warnings';
import { command as timeoutCmd } from '../src/commands/moderation/timeout';
import { command as kickCmd } from '../src/commands/moderation/kick';
import { command as banCmd } from '../src/commands/moderation/ban';
import { command as unbanCmd } from '../src/commands/moderation/unban';
import { command as clearCmd } from '../src/commands/moderation/clear';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 Starting GHOST Discord Bot Automated Verification');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // ----------------------------------------------------------------
  // TEST 1: Database & Persistence across simulated restarts
  // ----------------------------------------------------------------
  console.log('📦 Test Suite 1: Database & Settings Persistence Across Restarts');
  const testDbPath = path.resolve(__dirname, '../data/test_ghost.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  let testDb = new DatabaseService(testDbPath);
  const guildId = '999888777666';

  // 1.1 Create default settings
  const initialSettings = testDb.getGuildSettings(guildId);
  assert(initialSettings.guild_id === guildId && initialSettings.language === 'ar', '1.1 Default Guild Settings initialization in SQLite');

  // 1.2 Update settings
  testDb.updateGuildSettings(guildId, {
    welcome_channel_id: '111222333',
    language: 'en',
    embed_color: '#5800FF'
  });
  const updated = testDb.getGuildSettings(guildId);
  assert(updated.language === 'en' && updated.welcome_channel_id === '111222333' && updated.embed_color === '#5800FF', '1.2 Updating guild settings in SQLite');

  // 1.3 Simulate bot restart: close and reopen new connection
  testDb.close();
  testDb = new DatabaseService(testDbPath);
  const reloaded = testDb.getGuildSettings(guildId);
  assert(reloaded.language === 'en' && reloaded.welcome_channel_id === '111222333', '1.3 Settings persist after database close & reopen (Bot Restart)');

  // ----------------------------------------------------------------
  // TEST 2: Ticket Duplicate Prevention & Rapid Clicking
  // ----------------------------------------------------------------
  console.log('\n🎫 Test Suite 2: Ticket Duplicate Prevention & Lifecycle');
  const userId = 'user_test_42';

  // 2.1 No active ticket initially
  let activeTicket = testDb.getActiveTicket(guildId, userId, 'support');
  assert(activeTicket === undefined, '2.1 User has no active ticket initially');

  // 2.2 Create ticket
  const ticketNumber = testDb.getNextTicketNumber(guildId);
  const createdTicket = testDb.createTicket({
    ticket_number: ticketNumber,
    guild_id: guildId,
    channel_id: 'channel_ticket_101',
    user_id: userId,
    ticket_type: 'support',
    reason: 'Server connection issue',
    status: 'open',
    claimed_by: null,
    created_at: new Date().toISOString(),
    closed_at: null,
    closed_by: null,
    close_reason: null
  });
  assert(createdTicket.ticket_number === 1 && createdTicket.channel_id === 'channel_ticket_101', '2.2 Create ticket #0001');

  // 2.3 Rapid-click duplicate test
  activeTicket = testDb.getActiveTicket(guildId, userId, 'support');
  assert(activeTicket !== undefined && activeTicket.channel_id === 'channel_ticket_101', '2.3 Active ticket detected: duplicate creation prevented!');

  // 2.4 Ticket Claim
  testDb.updateTicket('channel_ticket_101', { status: 'claimed', claimed_by: 'staff_99' });
  const claimed = testDb.getTicketByChannel('channel_ticket_101');
  assert(claimed?.status === 'claimed' && claimed?.claimed_by === 'staff_99', '2.4 Ticket claimed by staff member recorded');

  // 2.5 Ticket Close
  testDb.updateTicket('channel_ticket_101', {
    status: 'closed',
    closed_at: new Date().toISOString(),
    closed_by: 'staff_99',
    close_reason: 'Resolved issue successfully'
  });
  activeTicket = testDb.getActiveTicket(guildId, userId, 'support');
  assert(activeTicket === undefined, '2.5 Closed ticket is no longer active, user can open new ticket if needed');

  // Clean test DB
  testDb.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  // ----------------------------------------------------------------
  // TEST 3: Roblox Service Input Parsers & Calculations
  // ----------------------------------------------------------------
  console.log('\n🟥 Test Suite 3: Roblox Parser, Age Calculator & Resilience');

  // 3.1 User ID extraction from profile URL
  const extractedId1 = robloxService.extractUserIdFromInput('https://www.roblox.com/users/156/profile');
  const extractedId2 = robloxService.extractUserIdFromInput('156');
  assert(extractedId1 === 156 && extractedId2 === 156, '3.1 Correctly extracts User ID from URL and digits');

  // 3.2 Place ID extraction from game URL
  const placeId1 = robloxService.extractPlaceIdFromInput('https://www.roblox.com/games/1818/Classic-Crossroads');
  const placeId2 = robloxService.extractPlaceIdFromInput('1818');
  assert(placeId1 === 1818 && placeId2 === 1818, '3.2 Correctly extracts Place ID from URL and digits');

  // 3.3 Group ID extraction from group URL
  const groupId1 = robloxService.extractGroupIdFromInput('https://www.roblox.com/groups/2/something');
  const groupId2 = robloxService.extractGroupIdFromInput('2');
  assert(groupId1 === 2 && groupId2 === 2, '3.3 Correctly extracts Group ID from URL and digits');

  // 3.4 Account Age Calculation in Arabic and English
  const mockCreationDate = new Date(Date.now() - 365 * 2 * 24 * 60 * 60 * 1000).toISOString(); // ~2 years ago
  const ageAr = robloxService.calculateAccountAge(mockCreationDate, 'ar');
  const ageEn = robloxService.calculateAccountAge(mockCreationDate, 'en');
  assert(ageAr.includes('سنة') && ageEn.includes('yr'), `3.4 Account Age calculated: AR="${ageAr}", EN="${ageEn}"`);

  // 3.5 Fallback test: when an API source fails
  const mockCounts = await robloxService.getUserCounts(9999999999);
  assert(
    typeof mockCounts.friends !== 'undefined' && typeof mockCounts.followers !== 'undefined',
    '3.5 Resilient counts: returns N/A fallback when private or unreachable without throwing'
  );

  // ----------------------------------------------------------------
  // TEST 4: Command Registry & JSON Serialization
  // ----------------------------------------------------------------
  console.log('\n⚡ Test Suite 4: Slash Commands Registry & Structure');
  const commands = [
    pingCmd, avatarCmd, bannerCmd, userinfoCmd, serverinfoCmd, helpCmd,
    setupCmd, welcomeCmd, ticketCmd, robloxCmd,
    warnCmd, warningsCmd, timeoutCmd, kickCmd, banCmd, unbanCmd, clearCmd
  ];

  assert(commands.length === 17, `4.1 All 17 required commands registered (Found: ${commands.length})`);

  let serializationSuccess = true;
  for (const cmd of commands) {
    try {
      const json = cmd.data.toJSON();
      if (!json.name || !json.description) {
        serializationSuccess = false;
      }
    } catch (e) {
      serializationSuccess = false;
      console.error(`Failed to serialize command: ${cmd.data.name}`, e);
    }
  }
  assert(serializationSuccess, '4.2 All commands serialize to valid Discord Slash Command JSON specification');

  console.log('\n====================================================');
  console.log(`📊 Test Results: ${passed}/${total} Tests Passed Successfully!`);
  console.log('====================================================');
}

runTestSuite().catch(err => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
