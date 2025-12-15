import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserLink, unlinkDiscordFromSteam } from '../services/steamAuth.js';

export const data = new SlashCommandBuilder()
  .setName('unlink')
  .setDescription('Unlink your Discord account from Steam');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  try {
    const userLink = await getUserLink(interaction.user.id);

    if (!userLink) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Not Linked')
        .setColor(0xe74c3c)
        .setDescription('Your Discord account is not linked to a Steam account.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Show confirmation with buttons
    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Confirm Unlink')
      .setColor(0xf39c12)
      .setDescription('Are you sure you want to unlink your Steam account?')
      .addFields(
        { name: 'Current Link', value: `Steam64: \`${userLink.steam64}\``, inline: false },
        { name: '⚠️ Warning', value: 'You will need to use `/link` again to vote or check your sessions.', inline: false }
      )
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_unlink')
          .setLabel('Yes, Unlink')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_unlink')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.editReply({
      embeds: [confirmEmbed],
      components: [row],
    });

    // Wait for button click
    try {
      const confirmation = await response.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 60_000, // 60 seconds
      });

      if (confirmation.customId === 'confirm_unlink') {
        // Perform the unlink
        const success = await unlinkDiscordFromSteam(interaction.user.id);

        if (success) {
          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Unlinked Successfully')
            .setColor(0x27ae60)
            .setDescription('Your Discord account has been unlinked from Steam.')
            .addFields({
              name: '🔗 Relink',
              value: 'You can use `/link` anytime to link your account again.',
              inline: false,
            })
            .setTimestamp();

          await confirmation.update({
            embeds: [successEmbed],
            components: [],
          });
        } else {
          throw new Error('Failed to unlink account');
        }
      } else {
        // Cancelled
        const cancelEmbed = new EmbedBuilder()
          .setTitle('❌ Cancelled')
          .setColor(0x95a5a6)
          .setDescription('Unlink operation cancelled. Your account remains linked.')
          .setTimestamp();

        await confirmation.update({
          embeds: [cancelEmbed],
          components: [],
        });
      }
    } catch (error) {
      // Timeout or error
      const timeoutEmbed = new EmbedBuilder()
        .setTitle('⏱️ Timed Out')
        .setColor(0x95a5a6)
        .setDescription('Confirmation timed out. Your account remains linked.')
        .setTimestamp();

      await interaction.editReply({
        embeds: [timeoutEmbed],
        components: [],
      });
    }

  } catch (error) {
    console.error('Error in /unlink command:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setColor(0xe74c3c)
      .setDescription('An error occurred while unlinking your account.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed], components: [] });
  }
}
