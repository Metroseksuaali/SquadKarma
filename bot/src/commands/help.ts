import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show available commands and usage guide');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('🤖 Squad Karma Bot - Help')
    .setColor(0x5865f2)
    .setDescription('Distributed reputation system for Squad players with proof of presence validation.')
    .addFields(
      {
        name: '👥 Player Commands',
        value: [
          '`/help` - Show this help message',
          '`/link` - Link your Discord to Steam account',
          '`/whoami` - Check your linked Steam account',
          '`/unlink` - Remove your Steam account link',
          '`/session [steam64]` - Check your current Squad session',
          '`/vote @user <up|down> <reason>` - Vote for a player you played with',
          '`/rep [@user]` - Check player reputation',
        ].join('\n'),
        inline: false,
      },
      {
        name: '⚙️ Admin Commands',
        value: [
          '`/register-node` - Register your Squad server node (requires Administrator)',
          '`/node-status` - Check your node health and statistics',
          '`/unregister-node` - Unregister your node from this server',
        ].join('\n'),
        inline: false,
      },
      {
        name: '📊 How It Works',
        value: [
          '1. Server admins run a **node** that tracks player sessions',
          '2. Admins register their node with this bot using `/register-node`',
          '3. Players link their Discord to Steam using `/link`',
          '4. Players vote for others they played with using `/vote`',
          '5. Bot validates votes against session data (proof of presence)',
          '6. Reputation is aggregated and visible via `/rep`',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🔒 Proof of Presence',
        value: 'Votes require both players to have played together for ≥5 minutes within the last 24 hours.',
        inline: false,
      },
      {
        name: '🔗 Links',
        value: '[GitHub](https://github.com/Metroseksuaali/SquadKarma) • [Documentation](https://github.com/Metroseksuaali/SquadKarma/tree/dev/docs)',
        inline: false,
      }
    )
    .setFooter({ text: 'Squad Karma - Distributed POC' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
