import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getUserLink } from '../services/steamAuth.js';

export const data = new SlashCommandBuilder()
  .setName('whoami')
  .setDescription('Check your linked Steam account');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  try {
    const userLink = await getUserLink(interaction.user.id);

    if (!userLink) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Not Linked')
        .setColor(0xe74c3c)
        .setDescription('Your Discord account is not linked to a Steam account.')
        .addFields({
          name: '🔗 How to Link',
          value: 'Use `/link` to connect your Steam account to Discord.',
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Your Linked Account')
      .setColor(0x27ae60)
      .setDescription('Your Discord account is linked to the following Steam account:')
      .addFields(
        { name: 'Steam64 ID', value: `\`${userLink.steam64}\``, inline: false },
        { name: 'Steam Profile', value: `[View Profile](https://steamcommunity.com/profiles/${userLink.steam64})`, inline: true },
        { name: 'Linked At', value: `<t:${Math.floor(userLink.linkedAt.getTime() / 1000)}:F>`, inline: true },
        { name: 'Status', value: userLink.verified ? '✅ Verified' : '⏳ Pending', inline: true }
      )
      .addFields({
        name: '🔄 Manage Link',
        value: 'Use `/unlink` to remove this connection.',
        inline: false,
      })
      .setThumbnail(`https://avatars.steamstatic.com/${userLink.steam64}.jpg`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error in /whoami command:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setColor(0xe74c3c)
      .setDescription('An error occurred while fetching your linked account.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
