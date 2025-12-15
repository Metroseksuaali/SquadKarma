/**
 * /status command
 *
 * Displays node health and statistics
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Check node health and statistics');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // Defer reply since we need to query the database
  await interaction.deferReply();

  try {
    // Get statistics from database
    const totalSessions = await prisma.session.count({
      where: { serverId: config.node.id },
    });

    const activeSessions = await prisma.session.count({
      where: {
        serverId: config.node.id,
        leftAt: null,
      },
    });

    const uniquePlayers = await prisma.session.groupBy({
      by: ['steam64'],
      where: { serverId: config.node.id },
    });

    const totalVotes = await prisma.vote.count();

    // Calculate uptime
    const uptimeSeconds = process.uptime();
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeDays = Math.floor(uptimeHours / 24);

    let uptimeString = '';
    if (uptimeDays > 0) {
      uptimeString = `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m`;
    } else if (uptimeHours > 0) {
      uptimeString = `${uptimeHours}h ${uptimeMinutes % 60}m`;
    } else {
      uptimeString = `${uptimeMinutes}m`;
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle(`📊 Node Status: ${config.node.name}`)
      .setDescription(`Node ID: \`${config.node.id}\``)
      .addFields(
        {
          name: '🕒 Uptime',
          value: uptimeString,
          inline: true,
        },
        {
          name: '💾 Memory',
          value: `${memoryUsedMB}MB / ${memoryTotalMB}MB`,
          inline: true,
        },
        {
          name: '\u200B', // Blank separator
          value: '\u200B',
          inline: false,
        },
        {
          name: '📈 Sessions',
          value: `Total: ${totalSessions}\nActive: ${activeSessions}`,
          inline: true,
        },
        {
          name: '👥 Players',
          value: `Unique: ${uniquePlayers.length}`,
          inline: true,
        },
        {
          name: '🗳️ Votes',
          value: `Total: ${totalVotes}`,
          inline: true,
        }
      )
      .setFooter({ text: 'Squad Karma - Distributed POC' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /status command:', error);
    await interaction.editReply({
      content: '❌ Failed to fetch node statistics. Please try again later.',
    });
  }
}
