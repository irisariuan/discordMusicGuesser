import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { BasicCommandFile } from "../lib/commands/type";
import { getSessionManager } from "../lib/voice/session";
import { createButtons } from "../lib/discord/action";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("repick")
		.setDescription("Repick the clips")
		.addIntegerOption((option) =>
			option
				.setName("clipnumber")
				.setDescription(
					"The number of clips to play in the game (default: 3)",
				)
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(10),
		)
		.addNumberOption((option) =>
			option
				.setName("cliplength")
				.setDescription(
					"The length of each clip in seconds (default: 2)",
				)
				.setRequired(false)
				.setMinValue(0.1)
				.setMaxValue(10),
		),
	execute: async (interaction) => {
		const clipNumber = interaction.options.getInteger("clipnumber");
		const clipLength = interaction.options.getNumber("cliplength");
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
		if (clipNumber) {
			manager.clipNumber = clipNumber;
		}
		if (clipLength) {
			manager.clipLength = clipLength;
		}
		if (await manager.prepareClip(manager.currentItem.id, true)) {
			manager.playCurrentClip();
			return interaction.editReply({
				content: `Repicked clips (Clips: ${manager.clipNumber}, Length: ${manager.clipLength}s)`,
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
