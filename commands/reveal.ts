import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { BasicCommandFile } from "../lib/commands/type";
import { getSessionManager } from "../lib/voice/session";
import yts from "yt-search";
import { readableTimestamp } from "../lib/utils";

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
		const currentSong = await yts({
			videoId: manager.currentItem.id,
		}).catch(() => null);
		if (!currentSong) {
			return interaction.editReply({
				content: "Failed to fetch metadata for the current song.",
			});
		}
		return interaction.editReply({
			content: `Current song is **${currentSong.title}** by *${currentSong.author.name}* (${currentSong.url})\nClip timestamps are ${manager.currentQueue
				.concat(...manager.currentPlayedItems, manager.currentItem)
				.sort((a, b) => a.duration[0] - b.duration[0])
				.map(
					(c) =>
						`\`${readableTimestamp(c.duration[0])} - ${readableTimestamp(c.duration[1])}\``,
				)
				.join(", ")}`,
		});
	},
} as BasicCommandFile;
