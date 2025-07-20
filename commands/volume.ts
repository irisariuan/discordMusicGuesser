import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BasicCommandFile } from "../lib/commands/type";
import { getSessionManager } from "../lib/voice/session";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("volume")
		.setDescription("Set the volume of the music player")
		.addIntegerOption((option) =>
			option
				.setName("level")
				.setDescription("Volume level (0-100)")
				.setRequired(true)
				.setMinValue(0)
				.setMaxValue(100),
		),
	execute: async (interaction) => {
		const level = interaction.options.getInteger("level", true);
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
		manager.setVolume(level / 100);
		return await interaction.editReply({
			content: `Volume set to ${level}%`,
		});
	},
} as BasicCommandFile;
