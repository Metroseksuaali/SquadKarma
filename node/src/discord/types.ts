/**
 * Discord bot type definitions
 */

import { ChatInputCommandInteraction, SlashCommandBuilder, Collection, Client } from 'discord.js';

/**
 * Command interface
 */
export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/**
 * Extended Discord Client with commands collection
 */
export interface DiscordClientWithCommands extends Client {
  commands: Collection<string, Command>;
}
