import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BasicCommandFile } from "../lib/commands/type";
import { getSessionManager } from "../lib/voice/session";
import { createButtons } from "../lib/action";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("replay")
		.setDescription("Replay the last played clip"),
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
		await interaction.deferReply();
		if (manager.playCurrentClip()) {
			return interaction.editReply({
				content: "Replaying the last played clip.",
				components: [
					createButtons({
						nextSong: false,
						lastClip: manager.currentPlayedItems.length > 0,
					}),
				],
			});
		}
		interaction.editReply({
			content: "No clip was played yet.",
		});
	},
} as BasicCommandFile;
