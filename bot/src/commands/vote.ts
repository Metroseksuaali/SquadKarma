import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { getNodeByGuild } from '../services/nodeRegistry.js';
import { getSteam64ForDiscord } from '../services/steamAuth.js';

// Reason categories from CLAUDE.md
const POSITIVE_REASONS = [
  'Good squad leader',
  'Helpful',
  'Good pilot/driver',
  'Team player',
  'Good communication',
  'Skilled player',
  'Good commander',
];

const NEGATIVE_REASONS = [
  'Trolling',
  'Teamkilling',
  'Toxic behavior',
  'Bad at vehicles',
  'Mic spam',
  'Not following orders',
  'Griefing',
  'AFK / Idle',
];

const NEUTRAL_REASONS = ['New player'];

const ALL_REASONS = [...POSITIVE_REASONS, ...NEGATIVE_REASONS, ...NEUTRAL_REASONS];

export const data = new SlashCommandBuilder()
  .setName('vote')
  .setDescription('Vote for a player you played with (requires proof of presence)')
  .addUserOption(option =>
    option
      .setName('player')
      .setDescription('The Discord user to vote for')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('direction')
      .setDescription('Vote up or down')
      .setRequired(true)
      .addChoices(
        { name: '👍 Upvote', value: 'UP' },
        { name: '👎 Downvote', value: 'DOWN' }
      )
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for your vote')
      .setRequired(true)
      .addChoices(
        ...ALL_REASONS.map(reason => ({ name: reason, value: reason }))
      )
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
    // Get the target user
    const targetUser = interaction.options.getUser('player', true);
    const direction = interaction.options.getString('direction', true) as 'UP' | 'DOWN';
    const reason = interaction.options.getString('reason', true);

    // Prevent self-voting
    if (targetUser.id === interaction.user.id) {
      await interaction.editReply({
        content: '❌ You cannot vote for yourself!',
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
        .addFields({
          name: 'ℹ️ What now?',
          value: 'An administrator needs to use `/register-node` to register a Squad server node.',
        });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Get Steam64 IDs for both users
    const voterSteam64 = await getSteam64ForDiscord(interaction.user.id);
    const targetSteam64 = await getSteam64ForDiscord(targetUser.id);

    if (!voterSteam64) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Account Not Linked')
        .setDescription('You have not linked your Steam account yet.')
        .setColor(0xe74c3c)
        .addFields({
          name: 'ℹ️ How to link',
          value: 'Use `/link` to link your Steam account before voting.',
        });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (!targetSteam64) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Target Not Linked')
        .setDescription(`${targetUser.username} has not linked their Steam account yet.`)
        .setColor(0xe74c3c)
        .addFields({
          name: 'ℹ️ Note',
          value: 'Players must link their Steam account with `/link` before they can be voted on.',
        });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Submit vote to node API
    const response = await fetch(`${node.apiUrl}/api/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${node.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voterSteam64,
        targetSteam64,
        direction,
        reasonCategory: reason,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Vote Not Allowed')
          .setDescription(data.message || 'You must have played with this player recently.')
          .setColor(0xe74c3c)
          .addFields({
            name: '📋 Requirements',
            value: [
              '• Both players must have played on the server',
              '• You must have overlapped for at least 5 minutes',
              '• Session must be within the last 24 hours',
            ].join('\n'),
          });

        if (data.details) {
          embed.addFields({
            name: '🔍 Details',
            value: [
              `Voter has recent sessions: ${data.details.voterHasSessions ? 'Yes' : 'No'}`,
              `Target has recent sessions: ${data.details.targetHasSessions ? 'Yes' : 'No'}`,
              `Minimum overlap: ${data.details.minOverlapMinutes || 5} minutes`,
            ].join('\n'),
          });
        }

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (response.status === 409) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Duplicate Vote')
          .setDescription('You have already voted for this player in this session.')
          .setColor(0xf39c12);

        if (data.existingVote) {
          embed.addFields({
            name: 'Your Previous Vote',
            value: [
              `Direction: ${data.existingVote.direction === 'UP' ? '👍 Upvote' : '👎 Downvote'}`,
              `Reason: ${data.existingVote.reasonCategory}`,
              `Date: <t:${Math.floor(new Date(data.existingVote.createdAt).getTime() / 1000)}:R>`,
            ].join('\n'),
          });
        }

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Generic error
      throw new Error(data.message || 'Failed to submit vote');
    }

    // Success!
    const directionEmoji = direction === 'UP' ? '👍' : '👎';
    const directionText = direction === 'UP' ? 'Upvoted' : 'Downvoted';
    const color = direction === 'UP' ? 0x2ecc71 : 0xe74c3c;

    const embed = new EmbedBuilder()
      .setTitle(`${directionEmoji} Vote Submitted!`)
      .setDescription(`Successfully ${directionText.toLowerCase()} **${targetUser.username}**`)
      .setColor(color)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Direction', value: directionText, inline: true }
      );

    if (data.proof) {
      const overlapMinutes = data.proof.overlapMinutes || 0;
      embed.addFields({
        name: '✅ Proof of Presence',
        value: `You played together for ${overlapMinutes} minutes`,
        inline: false,
      });
    }

    embed.setFooter({ text: 'Thank you for contributing to the community!' });
    embed.setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to submit vote:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Failed to Submit Vote')
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
