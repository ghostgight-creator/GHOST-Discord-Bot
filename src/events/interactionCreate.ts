import { Interaction } from 'discord.js';
import { Command } from '../types';
import { handleButtonInteraction } from '../interactions/buttons';
import { handleSelectMenuInteraction } from '../interactions/selectMenus';
import { handleModalSubmit } from '../interactions/modals';

export async function onInteractionCreate(
  interaction: Interaction, 
  commands: Map<string, Command>
): Promise<void> {
  try {
    // 1. Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) {
        console.warn(`[Command Not Found] ${interaction.commandName}`);
        return;
      }
      await command.execute(interaction);
      return;
    }

    // 2. Buttons
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
      return;
    }

    // 3. Select Menus
    if (interaction.isAnySelectMenu()) {
      await handleSelectMenuInteraction(interaction);
      return;
    }

    // 4. Modals
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
      return;
    }
  } catch (error: any) {
    console.error(`[Interaction Error] ${interaction.id}:`, error);
    const errorMsg = '❌ حدث خطأ غير متوقع أثناء معالجة هذا الإجراء. يرجى المحاولة لاحقاً.';
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: errorMsg, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
      }
    }
  }
}
