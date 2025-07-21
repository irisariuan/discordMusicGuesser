import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { BasicCommandFile } from "../lib/commands/type";
import { getSessionManager } from "../lib/voice/session";
import { createButtons } from "../lib/action";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("repick")
		.setDescription("Repick the clips"),
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
				content: "No clip is currently being played.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		await interaction.deferReply();
		if (await manager.prepareClip(manager.currentItem.id, true)) {
			return interaction.editReply({
				content: `Repicked clips`,
				components: [
					createButtons({ lastClip: false, nextSong: false }),
				],
			});
		}
		return interaction.editReply({
			content: "Failed to repick the clips.",
		});
	},
} as BasicCommandFile;
