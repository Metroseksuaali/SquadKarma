import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { getNodeByGuild } from '../services/nodeRegistry.js';
import { getSteam64ForDiscord } from '../services/steamAuth.js';

interface SessionData {
  id: number;
  steam64: string;
  playerName: string | null;
  joinedAt: string;
  leftAt: string | null;
  serverId: string;
}

export const data = new SlashCommandBuilder()
  .setName('session')
  .setDescription('Check your current session on the Squad server')
  .addStringOption(option =>
    option
      .setName('steam64')
      .setDescription('Steam64 ID to check (optional, uses your linked account by default)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guildId) {
    await interaction.editReply({
      content: '❌ This command can only be used in a Discord server.',
    });
    return;
  }

  // Get the node for this guild
  const node = await getNodeByGuild(interaction.guildId);
  if (!node) {
    const embed = new EmbedBuilder()
      .setTitle('❌ No Node Registered')
      .setDescription('This Discord server does not have a registered Squad server node.')
      .setColor(0xe74c3c)
      .addFields(
        {
          name: 'ℹ️ What now?',
          value: 'An administrator needs to use `/register-node` to register a Squad server node.',
        }
      );

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Get Steam64 ID (from option or linked account)
  let steam64 = interaction.options.getString('steam64');

  if (!steam64) {
    // Try to get linked Steam account
    steam64 = await getSteam64ForDiscord(interaction.user.id);

    if (!steam64) {
      const embed = new EmbedBuilder()
        .setTitle('❌ No Linked Account')
        .setDescription(
          'You have not linked your Steam account yet.\n\n' +
          'Please use `/link` to link your Steam account, or provide a Steam64 ID manually.'
        )
        .setColor(0xe74c3c);

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  }

  // Validate Steam64 format
  const steam64Pattern = /^7656119\d{10}$/;
  if (!steam64Pattern.test(steam64)) {
    await interaction.editReply({
      content: '❌ Invalid Steam64 ID format. It should be a 17-digit number starting with 7656119.',
    });
    return;
  }

  try {
    // Query node API for session info
    const response = await fetch(`${node.apiUrl}/api/session/${steam64}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${node.apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        const embed = new EmbedBuilder()
          .setTitle('📊 No Active Session')
          .setDescription(
            'No active session found for this player on the server.'
          )
          .setColor(0x95a5a6)
          .addFields(
            { name: 'Steam64 ID', value: `\`${steam64}\`` },
            { name: 'Server', value: node.serverName }
          );

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      throw new Error(`API returned status ${response.status}`);
    }

    const sessionData = await response.json() as SessionData;

    // Format session data
    const embed = new EmbedBuilder()
      .setTitle('✅ Active Session Found')
      .setColor(0x2ecc71)
      .addFields(
        { name: 'Player', value: sessionData.playerName || 'Unknown', inline: true },
        { name: 'Steam64', value: `\`${steam64}\``, inline: true },
        { name: 'Server', value: node.serverName, inline: false },
        {
          name: 'Joined At',
          value: `<t:${Math.floor(new Date(sessionData.joinedAt).getTime() / 1000)}:F>`,
          inline: true,
        },
        {
          name: 'Duration',
          value: formatDuration(new Date(sessionData.joinedAt)),
          inline: true,
        }
      )
      .setFooter({
        text: 'This data is tracked from server logs',
      });

    if (sessionData.leftAt) {
      embed.addFields({
        name: 'Left At',
        value: `<t:${Math.floor(new Date(sessionData.leftAt).getTime() / 1000)}:F>`,
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Failed to fetch session data:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Failed to Check Session')
      .setDescription(
        'Could not connect to the Squad server node. The node might be offline or experiencing issues.'
      )
      .setColor(0xe74c3c)
      .addFields(
        {
          name: 'ℹ️ What to do?',
          value: 'Try again later or contact a server administrator.',
        }
      );

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Format duration from a start time to now
 */
function formatDuration(start: Date): string {
  const now = new Date();
  const diff = now.getTime() - start.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
