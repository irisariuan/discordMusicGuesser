import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { BasicCommandFile } from "../lib/commands/type";
import { getSessionManager } from "../lib/voice/session";
import { searchVideo } from "../lib/youtube/core";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("playfullsong")
		.setDescription("Play the full song of the current clip"),
	execute: async (interaction) => {
		if (!interaction.guildId) {
			return interaction.reply({
				content: "This command can only be used in a server channel.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		const manager = getSessionManager(interaction.guildId);
		if (!manager) {
			return interaction.reply({
				content: "No game session is currently running in this server.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		if (!manager.currentItem) {
			return interaction.reply({
				content: "No current item to play the full song for.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		await interaction.deferReply();
		if (manager.playCurrentFullSong()) {
			const currentSong = await searchVideo(manager.currentItem.id);
			if (!currentSong) {
				return interaction.editReply({
					content: "Failed to fetch metadata for the current song.",
				});
			}
			return interaction.editReply({
				content: `Playing **${currentSong.title}** by *${currentSong.author.name}* (${currentSong.url})`,
			});
		}
	},
} as BasicCommandFile;
