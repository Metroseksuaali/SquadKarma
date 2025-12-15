import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getNodeByGuild, healthCheckNode } from '../services/nodeRegistry.js';

interface NodeStats {
  totalSessions?: number;
  activeSessions?: number;
  totalVotes?: number;
  uniquePlayers?: number;
  uptime?: string;
}

export const data = new SlashCommandBuilder()
  .setName('node-status')
  .setDescription('Check your registered node health and statistics (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guildId) {
    await interaction.editReply('This command can only be used in a server.');
    return;
  }

  // Get node registration
  const node = await getNodeByGuild(interaction.guildId);

  if (!node) {
    const embed = new EmbedBuilder()
      .setTitle('❌ No Node Registered')
      .setColor(0xff0000)
      .setDescription('This server does not have a registered node.')
      .addFields({
        name: 'How to Register',
        value: 'Use `/register-node` to register your Squad server node with this bot.',
        inline: false,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Check node health
  const isHealthy = await healthCheckNode(interaction.guildId);

  // Query node statistics
  let stats: NodeStats | null = null;

  if (isHealthy) {
    try {
      const response = await fetch(`${node.apiUrl}/api/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${node.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        stats = (await response.json()) as NodeStats;
      }
    } catch (error) {
      console.error('Failed to fetch node stats:', error);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(isHealthy ? '✅ Node Status - Healthy' : '❌ Node Status - Unhealthy')
    .setColor(isHealthy ? 0x00ff00 : 0xff0000)
    .addFields(
      { name: 'Server ID', value: `\`${node.serverId}\``, inline: true },
      { name: 'Server Name', value: node.serverName, inline: true },
      { name: 'API URL', value: `\`${node.apiUrl}\``, inline: false },
      { name: 'Status', value: isHealthy ? '🟢 Online' : '🔴 Offline', inline: true },
      { name: 'Registered By', value: `<@${node.registeredBy}>`, inline: true },
      { name: 'Registered At', value: `<t:${Math.floor(node.registeredAt.getTime() / 1000)}:F>`, inline: false }
    );

  if (stats) {
    embed.addFields(
      { name: '📊 Statistics', value: '\u200B', inline: false },
      { name: 'Total Sessions', value: stats.totalSessions?.toString() || 'N/A', inline: true },
      { name: 'Active Sessions', value: stats.activeSessions?.toString() || 'N/A', inline: true },
      { name: 'Total Votes', value: stats.totalVotes?.toString() || 'N/A', inline: true },
      { name: 'Unique Players', value: stats.uniquePlayers?.toString() || 'N/A', inline: true },
      { name: 'Uptime', value: stats.uptime || 'N/A', inline: true }
    );
  }

  if (node.lastHealthCheck) {
    embed.addFields({
      name: 'Last Health Check',
      value: `<t:${Math.floor(node.lastHealthCheck.getTime() / 1000)}:R>`,
      inline: false,
    });
  }

  if (!isHealthy) {
    embed.addFields({
      name: '⚠️ Troubleshooting',
      value: [
        '• Check that your node service is running',
        '• Verify the API URL is accessible',
        '• Check firewall and network settings',
        '• Ensure the API key is correct',
      ].join('\n'),
      inline: false,
    });
  }

  embed.setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
