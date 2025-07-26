import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { createButtons } from "../lib/discord/action";
import type { BasicCommandFile } from "../lib/commands/type";
import { readableSong } from "../lib/utils/format";
import { destroySessionManager, getSessionManager } from "../lib/voice/session";
import { searchVideoById } from "../lib/youtube/core";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("next")
		.setDescription("Play the next clip in the queue")
		.addBooleanOption((option) =>
			option
				.setName("skip")
				.setDescription("Skip current song and play the next one")
				.setRequired(false),
		),
	execute: async (interaction) => {
		const skip = interaction.options.getBoolean("skip") ?? false;
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

		if (!skip && manager.playNextClip()) {
			return interaction.editReply({
				content: `Playing clip (${manager.clipNumber - manager.currentQueue.length}/${manager.clipNumber})`,
				components: [
					createButtons({
						nextSong: false,
						lastClip: manager.currentPlayedItems.length > 0,
					}),
				],
			});
		}
		if (manager.currentItem) {
			const lastId = manager.currentItem.id;
			const lastMeta = await searchVideoById(lastId);
			if (!lastMeta) {
				return interaction.editReply({
					content: "Failed to fetch metadata for the last song.",
				});
			}

			interaction.editReply({
				content: readableSong(lastMeta, manager),
				components: [
					createButtons({
						nextSong: true,
						lastClip: manager.currentPlayedItems.length > 0,
					}),
				],
			});
		}

		if (!(await manager.nextSong())) {
			await interaction.editReply({
				content: "No more songs in the queue.",
			});
			return destroySessionManager(interaction.guildId);
		}
		manager.playCurrentClip();
	},
} as BasicCommandFile;
