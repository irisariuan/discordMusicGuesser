import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BasicCommandFile } from "../lib/commands/type";
import { queueManagers } from "../lib/shared";
import {
	destroySessionManager,
	type SessionManager,
} from "../lib/voice/session";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stop the current game session and clear the queue"),
	execute: async (interaction) => {
		if (!interaction.guildId) {
			return interaction.reply({
				content: "This command can only be used in a server channel.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		const manager: SessionManager | undefined = queueManagers.get(
			interaction.guildId,
		);
		if (!manager) {
			return interaction.reply({
				content: "No game session is currently running in this server.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		destroySessionManager(interaction.guildId);
		return interaction.reply({
			content: "Game session stopped and queue cleared.",
			flags: [MessageFlags.Ephemeral],
		});
	},
} as BasicCommandFile;
