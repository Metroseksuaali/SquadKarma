import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { unregisterNode, getNodeForGuild } from '../services/nodeRegistry.js';

export const data = new SlashCommandBuilder()
  .setName('unregister-node')
  .setDescription('Remove the registered Squad server node for this Discord server')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guildId) {
    await interaction.editReply({
      content: '❌ This command can only be used in a Discord server.',
    });
    return;
  }

  // Check if a node is registered
  const node = await getNodeForGuild(interaction.guildId);
  if (!node) {
    const embed = new EmbedBuilder()
      .setTitle('❌ No Node Registered')
      .setDescription('This Discord server does not have a registered Squad server node.')
      .setColor(0xe74c3c)
      .addFields(
        {
          name: 'ℹ️ What now?',
          value: 'Use `/register-node` to register a Squad server node first.',
        }
      );

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Create confirmation embed
  const confirmEmbed = new EmbedBuilder()
    .setTitle('⚠️ Confirm Node Removal')
    .setDescription(
      '**Are you sure you want to unregister this node?**\n\n' +
      'This will remove the node registration and prevent players from voting. ' +
      'Session data and votes stored on the node will NOT be deleted.'
    )
    .setColor(0xf39c12)
    .addFields(
      { name: 'Server Name', value: node.serverName, inline: true },
      { name: 'Server ID', value: `\`${node.serverId}\``, inline: true },
      { name: 'API URL', value: node.apiUrl, inline: false }
    );

  // Create confirmation buttons
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_unregister')
        .setLabel('Yes, Unregister Node')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_unregister')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

  const response = await interaction.editReply({
    embeds: [confirmEmbed],
    components: [row],
  });

  // Wait for user confirmation
  try {
    const confirmation = await response.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000, // 60 seconds
    });

    if (confirmation.customId === 'confirm_unregister') {
      // Unregister the node
      await unregisterNode(interaction.guildId);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Node Unregistered')
        .setDescription(
          `Successfully removed the node registration for **${node.serverName}**.`
        )
        .setColor(0x2ecc71)
        .addFields(
          {
            name: 'ℹ️ What happens now?',
            value:
              '• Players can no longer vote on this server\n' +
              '• Health checks will stop\n' +
              '• Node data remains intact on the server\n' +
              '• You can re-register the node anytime with `/register-node`',
          }
        );

      await confirmation.update({
        embeds: [successEmbed],
        components: [],
      });
    } else {
      // User cancelled
      const cancelEmbed = new EmbedBuilder()
        .setTitle('❌ Cancelled')
        .setDescription('Node unregistration has been cancelled.')
        .setColor(0x95a5a6);

      await confirmation.update({
        embeds: [cancelEmbed],
        components: [],
      });
    }
  } catch (error) {
    // Timeout or error
    const timeoutEmbed = new EmbedBuilder()
      .setTitle('⏱️ Confirmation Timeout')
      .setDescription(
        'You did not confirm in time. The node is still registered.\n\n' +
        'Run `/unregister-node` again if you want to remove it.'
      )
      .setColor(0x95a5a6);

    await interaction.editReply({
      embeds: [timeoutEmbed],
      components: [],
    });
  }
}
