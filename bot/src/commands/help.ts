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
          '`/link <steam_profile>` - Link your Discord to Steam account',
          '`/whoami` - Check your linked Steam account',
          '`/session` - Check your current Squad session',
          '`/rep <steam64>` - Check player reputation',
          '`/vote @user <up|down> <reason>` - Vote for a player (requires proof of presence)',
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
        name: '🔒 Proof of Presence',
        value: 'Votes are only valid if both players were on the server together for ≥5 minutes within the last 24 hours.',
        inline: false,
      },
      {
        name: '📊 How It Works',
        value: [
          '1. Server admins run a **node** that tracks player sessions',
          '2. Admins register their node with this bot using `/register-node`',
          '3. Players link their Discord to Steam using `/link`',
          '4. Players vote for others they played with using `/vote`',
          '5. Bot validates votes against the node\'s session data',
          '6. Reputation is aggregated across all registered nodes',
        ].join('\n'),
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
