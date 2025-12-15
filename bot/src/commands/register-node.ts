import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { registerNode } from '../services/nodeRegistry.js';
import { z } from 'zod';

export const data = new SlashCommandBuilder()
  .setName('register-node')
  .setDescription('Register your Squad server node with this bot (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((option) =>
    option
      .setName('server-id')
      .setDescription('Your node server ID (e.g., "alpha-squad-server")')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('server-name')
      .setDescription('Your Squad server name (e.g., "Alpha Squad Server")')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('api-url')
      .setDescription('Your node API URL (https://your-server.com:3000)')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('api-key')
      .setDescription('Your node API key (will be encrypted)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // Defer reply immediately (this is admin-only, so not ephemeral)
  await interaction.deferReply({ ephemeral: true });

  // Get parameters
  const serverId = interaction.options.getString('server-id', true);
  const serverName = interaction.options.getString('server-name', true);
  const apiUrl = interaction.options.getString('api-url', true);
  const apiKey = interaction.options.getString('api-key', true);

  // Validate inputs
  try {
    // Validate API URL format
    const urlSchema = z.string().url().startsWith('https://');
    urlSchema.parse(apiUrl);

    // Validate API key length
    const keySchema = z.string().min(32);
    keySchema.parse(apiKey);

    // Validate server ID format (alphanumeric, hyphens, underscores)
    const serverIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/);
    serverIdSchema.parse(serverId);

  } catch (error) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Invalid Input')
      .setColor(0xff0000)
      .setDescription('Please check your inputs:')
      .addFields(
        { name: 'API URL', value: 'Must be a valid HTTPS URL (e.g., `https://your-server.com:3000`)', inline: false },
        { name: 'API Key', value: 'Must be at least 32 characters long', inline: false },
        { name: 'Server ID', value: 'Must contain only letters, numbers, hyphens, and underscores', inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Test connection to node API
  try {
    const healthResponse = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!healthResponse.ok) {
      const embed = new EmbedBuilder()
        .setTitle('❌ API Connection Failed')
        .setColor(0xff0000)
        .setDescription(`Could not connect to your node API at \`${apiUrl}\``)
        .addFields(
          { name: 'Status Code', value: `${healthResponse.status}`, inline: true },
          { name: 'Status Text', value: healthResponse.statusText, inline: true }
        )
        .addFields({
          name: 'Troubleshooting',
          value: '• Check that your node is running\n• Verify the API URL is correct\n• Ensure the API key matches your node configuration\n• Check firewall settings',
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Connection successful, register the node
    await registerNode({
      guildId: interaction.guildId!,
      serverId,
      serverName,
      apiUrl,
      apiKey,
      registeredBy: interaction.user.id,
    });

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Node Registered Successfully')
      .setColor(0x00ff00)
      .setDescription(`Your Squad server node has been registered with this Discord bot!`)
      .addFields(
        { name: 'Server ID', value: `\`${serverId}\``, inline: true },
        { name: 'Server Name', value: serverName, inline: true },
        { name: 'API URL', value: `\`${apiUrl}\``, inline: false },
        { name: 'Registered By', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Guild ID', value: `\`${interaction.guildId}\``, inline: true }
      )
      .addFields({
        name: '🎯 Next Steps',
        value: '• Players can now use `/vote`, `/rep`, and `/session` commands in this server\n• The bot will validate votes against your node\'s session data\n• Use `/node-status` to check your node health',
        inline: false,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });

  } catch (error) {
    console.error('Error registering node:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const embed = new EmbedBuilder()
      .setTitle('❌ Registration Failed')
      .setColor(0xff0000)
      .setDescription(`Failed to register your node: \`${errorMessage}\``)
      .addFields({
        name: 'Common Issues',
        value: '• Node API is not running\n• API URL is incorrect\n• API key does not match\n• Firewall blocking connection\n• Node API does not have `/api/health` endpoint',
        inline: false,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
