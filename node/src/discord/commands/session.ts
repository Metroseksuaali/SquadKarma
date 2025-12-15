/**
 * /session command
 *
 * Check your current or recent session on the server
 * Note: In Phase 3, this will use Discord<->Steam linking
 * For now, it shows a placeholder message
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';

export const data = new SlashCommandBuilder()
  .setName('session')
  .setDescription('Check your current session')
  .addStringOption((option) =>
    option
      .setName('steam64')
      .setDescription('Steam64 ID (optional, for testing before Phase 3 linking)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // Use ephemeral for privacy
  await interaction.deferReply({ ephemeral: true });

  try {
    // Get Steam64 from option (Phase 2 testing) or from linked account (Phase 3)
    const steam64Input = interaction.options.getString('steam64');

    if (!steam64Input) {
      // Phase 3 TODO: Look up Steam64 from Discord ID in UserLink table
      await interaction.editReply({
        content: '❌ You haven\'t linked your Steam account yet.\n\n' +
          '📝 **Phase 3 Feature:** Use `/link` to connect your Discord account to Steam.\n\n' +
          '🧪 **For testing:** Use `/session steam64:<your_steam64_id>`',
      });
      return;
    }

    // Validate Steam64 format
    if (!/^\d{17}$/.test(steam64Input) || !steam64Input.startsWith('7656119')) {
      await interaction.editReply({
        content: '❌ Invalid Steam64 ID format.\n\n' +
          'Steam64 IDs are 17 digits starting with `7656119`.\n' +
          'Example: `76561198012345678`',
      });
      return;
    }

    // Find most recent session for this player
    const session = await prisma.session.findFirst({
      where: {
        steam64: steam64Input,
        serverId: config.node.id,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    if (!session) {
      await interaction.editReply({
        content: `❌ No session found for Steam64: \`${steam64Input}\`\n\n` +
          'You must play on this server before checking your session.',
      });
      return;
    }

    // Calculate duration
    const isActive = session.leftAt === null;
    const endTime = session.leftAt || new Date();
    const durationMs = endTime.getTime() - session.joinedAt.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationHours = Math.floor(durationMinutes / 60);

    let durationString = '';
    if (durationHours > 0) {
      durationString = `${durationHours}h ${durationMinutes % 60}m`;
    } else {
      durationString = `${durationMinutes}m`;
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(isActive ? Colors.Green : Colors.Grey)
      .setTitle(isActive ? '🟢 Active Session' : '⚪ Recent Session')
      .addFields(
        {
          name: '👤 Player',
          value: session.playerName,
          inline: false,
        },
        {
          name: '🔑 Steam64',
          value: `\`${session.steam64}\``,
          inline: false,
        },
        {
          name: '⏰ Joined',
          value: `<t:${Math.floor(session.joinedAt.getTime() / 1000)}:F>\n(<t:${Math.floor(session.joinedAt.getTime() / 1000)}:R>)`,
          inline: true,
        },
        {
          name: isActive ? '📊 Duration' : '⏰ Left',
          value: isActive
            ? durationString
            : `<t:${Math.floor(endTime.getTime() / 1000)}:F>\n(<t:${Math.floor(endTime.getTime() / 1000)}:R>)`,
          inline: true,
        }
      );

    if (!isActive) {
      embed.addFields({
        name: '⏱️ Session Duration',
        value: durationString,
        inline: false,
      });
    }

    embed.setFooter({ text: `Session #${session.id} • ${config.node.name}` });
    embed.setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in /session command:', error);
    await interaction.editReply({
      content: '❌ Failed to fetch session data. Please try again later.',
    });
  }
}
