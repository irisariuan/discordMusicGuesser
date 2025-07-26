import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { BasicCommandFile } from "../lib/commands/type";
import { readableSong } from "../lib/utils/format";
import { getSessionManager } from "../lib/voice/session";
import { searchVideoById } from "../lib/youtube/core";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("reveal")
		.setDescription("Reveal the current song privately"),
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
				content: "No song is currently playing.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
		const currentSong = await searchVideoById(manager.currentItem.id);
		if (!currentSong) {
			return interaction.editReply({
				content: "Failed to fetch metadata for the current song.",
			});
		}
		return interaction.editReply({
			content: readableSong(currentSong, manager),
		});
	},
} as BasicCommandFile;
