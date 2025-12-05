import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { getNodeByGuild } from '../services/nodeRegistry.js';
import { getSteam64ForDiscord } from '../services/steamAuth.js';

export const data = new SlashCommandBuilder()
  .setName('rep')
  .setDescription('Check a player\'s reputation')
  .addUserOption(option =>
    option
      .setName('player')
      .setDescription('The Discord user to check (optional, defaults to yourself)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('steam64')
      .setDescription('Steam64 ID to check directly (optional)')
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

  try {
    // Get the node for this guild
    const node = await getNodeByGuild(interaction.guildId);
    if (!node) {
      const embed = new EmbedBuilder()
        .setTitle('❌ No Node Registered')
        .setDescription('This Discord server does not have a registered Squad server node.')
        .setColor(0xe74c3c)
        .addFields({
          name: 'ℹ️ What now?',
          value: 'An administrator needs to use `/register-node` to register a Squad server node.',
        });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Determine which user/steam64 to check
    let steam64: string | null = null;
    let displayName: string;
    const targetUser = interaction.options.getUser('player');
    const manualSteam64 = interaction.options.getString('steam64');

    if (manualSteam64) {
      // Validate Steam64 format
      const steam64Pattern = /^7656119\d{10}$/;
      if (!steam64Pattern.test(manualSteam64)) {
        await interaction.editReply({
          content: '❌ Invalid Steam64 ID format. It should be a 17-digit number starting with 7656119.',
        });
        return;
      }
      steam64 = manualSteam64;
      displayName = `Steam User (${steam64})`;
    } else if (targetUser) {
      steam64 = await getSteam64ForDiscord(targetUser.id);
      displayName = targetUser.username;
    } else {
      // Default to checking own reputation
      steam64 = await getSteam64ForDiscord(interaction.user.id);
      displayName = interaction.user.username;
    }

    if (!steam64) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Account Not Linked')
        .setDescription(
          targetUser
            ? `${targetUser.username} has not linked their Steam account yet.`
            : 'You have not linked your Steam account yet.'
        )
        .setColor(0xe74c3c)
        .addFields({
          name: 'ℹ️ How to link',
          value: 'Use `/link` to link your Steam account.',
        });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Query node API for reputation
    const response = await fetch(`${node.apiUrl}/api/reputation/${steam64}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${node.apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const repData = await response.json() as {
      steam64: string;
      totalVotes: number;
      upvotes: number;
      downvotes: number;
      netReputation: number;
      categories: Record<string, { up: number; down: number }>;
      recentVotes: Array<{
        direction: string;
        reasonCategory: string;
        createdAt: string;
        replicatedFrom: string | null;
      }>;
      timestamp: string;
    };

    // Determine reputation color and emoji
    let color: number;
    let reputationEmoji: string;
    if (repData.netReputation > 10) {
      color = 0x2ecc71; // Green
      reputationEmoji = '✨';
    } else if (repData.netReputation > 0) {
      color = 0x27ae60; // Light green
      reputationEmoji = '👍';
    } else if (repData.netReputation === 0) {
      color = 0x95a5a6; // Gray
      reputationEmoji = '➖';
    } else if (repData.netReputation > -10) {
      color = 0xe67e22; // Orange
      reputationEmoji = '👎';
    } else {
      color = 0xe74c3c; // Red
      reputationEmoji = '⚠️';
    }

    const embed = new EmbedBuilder()
      .setTitle(`${reputationEmoji} Reputation for ${displayName}`)
      .setColor(color);

    if (repData.totalVotes === 0) {
      embed.setDescription('This player has no reputation votes yet.');
      embed.addFields({
        name: 'ℹ️ How it works',
        value: 'Players receive votes from others they play with. Votes require proof of presence (playing together for at least 5 minutes).',
      });
    } else {
      embed.setDescription(`Net Reputation: **${repData.netReputation > 0 ? '+' : ''}${repData.netReputation}**`);
      embed.addFields(
        {
          name: '📊 Vote Summary',
          value: [
            `Total Votes: ${repData.totalVotes}`,
            `👍 Upvotes: ${repData.upvotes}`,
            `👎 Downvotes: ${repData.downvotes}`,
          ].join('\n'),
          inline: true,
        }
      );

      // Add category breakdown if there are votes
      if (Object.keys(repData.categories).length > 0) {
        const categoryLines: string[] = [];
        const sortedCategories = Object.entries(repData.categories)
          .sort(([, a], [, b]) => (b.up + b.down) - (a.up + a.down))
          .slice(0, 5); // Top 5 categories

        for (const [category, counts] of sortedCategories) {
          const net = counts.up - counts.down;
          const netStr = net > 0 ? `+${net}` : `${net}`;
          categoryLines.push(`${category}: ${netStr} (${counts.up}↑ ${counts.down}↓)`);
        }

        if (categoryLines.length > 0) {
          embed.addFields({
            name: '📋 Top Categories',
            value: categoryLines.join('\n'),
            inline: false,
          });
        }
      }

      // Add recent votes
      if (repData.recentVotes.length > 0) {
        const recentLines = repData.recentVotes.slice(0, 5).map(vote => {
          const emoji = vote.direction === 'UP' ? '👍' : '👎';
          const timestamp = Math.floor(new Date(vote.createdAt).getTime() / 1000);
          return `${emoji} ${vote.reasonCategory} (<t:${timestamp}:R>)`;
        });

        embed.addFields({
          name: '🕐 Recent Votes',
          value: recentLines.join('\n'),
          inline: false,
        });
      }
    }

    embed.addFields({
      name: 'Steam64',
      value: `\`${steam64}\``,
      inline: false,
    });

    embed.setFooter({ text: `Data from ${node.serverName}` });
    embed.setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to get reputation:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Failed to Get Reputation')
      .setDescription(
        'Could not connect to the Squad server node. The node might be offline or experiencing issues.'
      )
      .setColor(0xe74c3c)
      .addFields({
        name: 'ℹ️ What to do?',
        value: 'Try again later or contact a server administrator.',
      });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
