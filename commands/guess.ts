import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { BasicCommandFile } from "../lib/commands/type";
import { getSessionManager } from "../lib/voice/session";
import { compareGuess, searchVideoById } from "../lib/youtube/core";
import { createButtons } from "../lib/discord/action";
import { roundTo } from "../lib/utils";
import { NO_AI } from "../lib/env/env";
import { doubleDash } from "../lib/env/flag";
import { flags } from "../lib/shared";
import { readableSong } from "../lib/utils/format";

const aiServiceAllowed = !(
	flags.getFlagValue([doubleDash("noTitleCleaning")], true) || NO_AI
);

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("guess")
		.setDescription("Guess the current playing song")
		.addStringOption((option) =>
			option
				.setName("guess")
				.setDescription("Your guess for the current song")
				.setRequired(true),
		)
		.addBooleanOption((option) =>
			option
				.setName("useai")
				.setDescription(
					"Use AI to compare your guess with the current song (Expermimental, may give wrong results)",
				)
				.setRequired(false),
		),
	async execute(interaction) {
		const guess = interaction.options.getString("guess", true);
		const useAi = interaction.options.getBoolean("useai") ?? false;
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

		await interaction.deferReply();
		if (useAi && aiServiceAllowed) {
			const result = await compareGuess(
				guess,
				manager.currentItem.id,
				true,
			);
			if (result === null) {
				return interaction.editReply({
					content:
						"Failed to compare your guess with the current song.",
				});
			}
			return interaction.editReply({
				content: `Your guess is ${result ? "correct" : "incorrect"}!`,
				components: [
					createButtons({
						nextSong: result,
						lastClip: manager.currentPlayedItems.length > 0,
					}),
				],
			});
		} else if (useAi && !aiServiceAllowed) {
			await interaction.followUp({
				content: "AI service is off for now.",
			});
		}
		const result = await compareGuess(guess, manager.currentItem.id, false);
		if (result === null) {
			return interaction.editReply({
				content: "Failed to compare your guess with the current song.",
			});
		}
		if (result < 0.7) {
			return interaction.editReply({
				content: `Your guess is incorrect. (${roundTo(result * 100, 2)}%)`,
				components: [
					createButtons({
						nextSong: false,
						lastClip: manager.currentPlayedItems.length > 0,
					}),
				],
			});
		}
		const answer = await searchVideoById(manager.currentItem.id);
		if (result === 1) {
			return interaction.editReply({
				content: `Your guess is **COMPLETELY** correct🎉!\n${answer ? readableSong(answer, manager) : "*No metadata found for the current song.*"}`,
				components: [
					createButtons({
						nextSong: true,
						lastClip: manager.currentPlayedItems.length > 0,
					}),
				],
			});
		}
		return interaction.editReply({
			content: `Your guess ${result > 0.8 ? "is" : "is mostly"} correct! (${roundTo(result * 100, 2)}%)\n${answer ? readableSong(answer, manager) : "*No metadata found for the current song.*"}`,
			components: [
				createButtons({
					nextSong: true,
					lastClip: manager.currentPlayedItems.length > 0,
				}),
			],
		});
	},
} as BasicCommandFile;
