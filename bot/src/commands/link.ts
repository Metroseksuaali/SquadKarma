import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { generateSteamAuthUrl, getUserLink } from '../services/steamAuth.js';

export const data = new SlashCommandBuilder()
  .setName('link')
  .setDescription('Link your Discord account to your Steam account');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if user is already linked
    const existingLink = await getUserLink(interaction.user.id);

    if (existingLink) {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Already Linked')
        .setColor(0xf39c12)
        .setDescription('Your Discord account is already linked to a Steam account.')
        .addFields(
          { name: 'Steam64 ID', value: `\`${existingLink.steam64}\``, inline: true },
          { name: 'Linked At', value: `<t:${Math.floor(existingLink.linkedAt.getTime() / 1000)}:F>`, inline: true }
        )
        .addFields({
          name: '🔄 Want to relink?',
          value: 'Use `/unlink` first, then `/link` again to link a different Steam account.',
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Generate authentication URL with state token
    const { authUrl } = await generateSteamAuthUrl(interaction.user.id);

    // Send DM with authentication link
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('🔗 Link Your Steam Account')
        .setColor(0x5865f2)
        .setDescription('Click the button below to authenticate with Steam and link your account.')
        .addFields({
          name: '⚠️ Important',
          value: [
            '• This link expires in 10 minutes',
            '• You will be redirected to Steam to log in',
            '• After logging in, you\'ll be redirected back to confirm',
            '• Keep this link private',
          ].join('\n'),
          inline: false,
        })
        .addFields({
          name: '🔗 Authentication Link',
          value: `[Click here to authenticate with Steam](${authUrl})`,
          inline: false,
        })
        .setFooter({ text: 'Squad Karma - Steam Authentication' })
        .setTimestamp();

      await interaction.user.send({ embeds: [dmEmbed] });

      // Confirm in channel
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Check Your DMs')
        .setColor(0x27ae60)
        .setDescription('I\'ve sent you a direct message with instructions to link your Steam account.')
        .addFields({
          name: 'Next Steps',
          value: [
            '1. Check your DMs from me',
            '2. Click the Steam authentication link',
            '3. Log in to Steam (if not already logged in)',
            '4. You\'ll be redirected back after confirmation',
          ].join('\n'),
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [confirmEmbed] });

    } catch (dmError) {
      // Couldn't send DM - send link in ephemeral reply instead
      const fallbackEmbed = new EmbedBuilder()
        .setTitle('🔗 Link Your Steam Account')
        .setColor(0xf39c12)
        .setDescription('I couldn\'t send you a DM. Here\'s your authentication link:')
        .addFields({
          name: '⚠️ Important',
          value: [
            '• This link expires in 10 minutes',
            '• Keep this link private (this message is only visible to you)',
            '• Click the link below to authenticate with Steam',
          ].join('\n'),
          inline: false,
        })
        .addFields({
          name: '🔗 Authentication Link',
          value: `[Click here to authenticate with Steam](${authUrl})`,
          inline: false,
        })
        .setFooter({ text: 'Enable DMs from server members to receive links privately' })
        .setTimestamp();

      await interaction.editReply({ embeds: [fallbackEmbed] });
    }

  } catch (error) {
    console.error('Error in /link command:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setColor(0xe74c3c)
      .setDescription('An error occurred while generating your authentication link.')
      .addFields({
        name: 'Error Details',
        value: error instanceof Error ? error.message : 'Unknown error',
        inline: false,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
