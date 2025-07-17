import { SlashCommandBuilder } from "discord.js";
import type { BasicCommandFile } from "../lib/commands/type";
import { extractYouTubePlaylistId } from "../lib/youtube";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("start")
		.setDescription("Start Music Game")
		.addStringOption((option) =>
			option
				.setName("url")
				.setDescription(
					"The URL of the song list to start the game with",
				)
				.setRequired(true),
		),
	execute: async (interaction) => {
		const url = interaction.options.getString("url", true);
		const id = extractYouTubePlaylistId(url)
		if (!id) {
			return interaction.reply({
				content: "Invalid YouTube playlist URL",
				ephemeral: true,
			});
		}
		await interaction.reply({
			content: `Starting the game with playlist ID: ${id}`,
			ephemeral: true,
		});
		
	},
} as BasicCommandFile;
