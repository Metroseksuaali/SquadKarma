import type { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

/**
 * Slash command interface
 */
export interface SlashCommand {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
