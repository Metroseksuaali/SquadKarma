/**
 * /help command
 *
 * Shows available commands and how to use the bot
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { config } from '../../config/env.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show available commands and usage guide');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(Colors.Blue)
    .setTitle('📚 Squad Karma Bot - Help')
    .setDescription(
      'Squad Karma is a **distributed proof-of-presence reputation system** for Squad players.\n\n' +
      'You can only vote for players you actually played with!'
    )
    .addFields(
      {
        name: '📊 Available Commands (Phase 2)',
        value:
          '`/status` - Check node health and statistics\n' +
          '`/session [steam64]` - Check your current/recent session\n' +
          '`/help` - Show this help message',
        inline: false,
      },
      {
        name: '🔜 Coming in Phase 3',
        value:
          '`/link` - Link your Discord account to Steam\n' +
          '`/unlink` - Unlink your Steam account\n' +
          '`/whoami` - Check your linked Steam account',
        inline: false,
      },
      {
        name: '🔜 Coming in Phase 4',
        value:
          '`/vote @user <up|down> <reason>` - Vote for a player\n' +
          '`/rep <steam64>` - Check player reputation',
        inline: false,
      },
      {
        name: '🎯 How It Works',
        value:
          '1. **Proof of Presence**: This node tracks player sessions from server logs\n' +
          '2. **Session Validation**: You can only vote if you played together for ≥5 minutes\n' +
          '3. **Time Window**: Votes must be within 24 hours of playing together\n' +
          '4. **Distributed**: Each server runs its own node, votes are shared across trusted nodes',
        inline: false,
      },
      {
        name: '🔗 Links',
        value:
          '[GitHub](https://github.com/Metroseksuaali/SquadKarma) • ' +
          '[Documentation](https://github.com/Metroseksuaali/SquadKarma/blob/main/docs/PROJECT_SPEC.md)',
        inline: false,
      }
    )
    .setFooter({ text: `${config.node.name} • Phase 2: Discord Bot` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
