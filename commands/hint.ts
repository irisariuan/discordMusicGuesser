import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { BasicCommandFile } from "../lib/commands/type";
import { getSessionManager } from "../lib/voice/session";
import { shuffleArray } from "../lib/utils";
import yts from "yt-search";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("hint")
		.setDescription("Get a hint for the current game session")
		.addIntegerOption((option) =>
			option
				.setName("count")
				.setDescription("Number of hints to provide")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(5),
		),
	execute: async (interaction) => {
		const count = interaction.options.getInteger("count") ?? 4;
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
				content: "No current song to provide a hint for.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		await interaction.deferReply();
		const searchingIds = shuffleArray([
			...shuffleArray(manager.fixedQueue).slice(0, count),
			manager.currentItem.id,
		]);
		const searchResults = await Promise.all(
			searchingIds.map((v) => yts({ videoId: v })),
		);
		const hints = searchResults.map(
			(video) =>
				`**${video.title}** by *${video.author.name}* (${video.url})`,
		);
		return interaction.editReply({
			content: `Here are your hints:\n${hints.slice(0, count).join("\n\n")}`,
		});
	},
} as BasicCommandFile;
