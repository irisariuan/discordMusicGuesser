import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BasicCommandFile } from "../lib/commands/type";
import { createSessionManager } from "../lib/voice/session";
import { queueManagers } from "../lib/shared";
import {
	extractYouTubePlaylistId,
	getVideoIdsFromPlaylist,
} from "../lib/youtube/core";
import { createButtons } from "../lib/action";

export default {
	commmandBuilder: new SlashCommandBuilder()
		.setName("start")
		.setDescription("Start Music Game")
		.addStringOption((option) =>
			option
				.setName("url")
				.setDescription(
					"The URL of the song list to start the game with",
				)
				.setRequired(true),
		)
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
				.setMinValue(0.5)
				.setMaxValue(10),
		),
	execute: async (interaction) => {
		const url = interaction.options.getString("url", true);
		const clipNumber = interaction.options.getInteger("clipnumber") ?? 3;
		const clipLength = interaction.options.getNumber("cliplength") ?? 2;

		const playlistId = extractYouTubePlaylistId(url);
		if (!playlistId) {
			return interaction.reply({
				content: "Invalid YouTube playlist URL",
				flags: [MessageFlags.Ephemeral],
			});
		}
		if (
			!interaction.guild ||
			!interaction.guildId ||
			!interaction.channel
		) {
			return interaction.reply({
				content: "This command can only be used in a server channel.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		if (queueManagers.has(interaction.guildId)) {
			return interaction.reply({
				content: "A game session is already running in this server.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		const videos = await getVideoIdsFromPlaylist(playlistId);
		if (!videos) {
			return interaction.reply({
				content: "Failed to fetch videos from the playlist.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		if (videos.length === 0) {
			return interaction.reply({
				content: "The playlist is empty.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		if (
			!interaction.member ||
			!("voice" in interaction.member) ||
			!interaction.member.voice.channelId
		) {
			return interaction.reply({
				content: "You must be in a voice channel to start the game.",
				flags: [MessageFlags.Ephemeral],
			});
		}

		await interaction.deferReply();

		let connection = getVoiceConnection(interaction.guildId);
		if (!connection) {
			console.log("Joined voice channel");
			connection = joinVoiceChannel({
				channelId: interaction.member.voice.channelId,
				guildId: interaction.guildId,
				adapterCreator: interaction.guild.voiceAdapterCreator,
				selfMute: false,
			});
		}
		const manager = createSessionManager(
			interaction.guildId,
			connection,
			clipNumber,
			clipLength,
			videos,
		);
		await interaction.editReply({
			content: `Game started with ${videos.length} songs from the playlist!`,
		});
		await manager.nextSong();
		await manager.playCurrentClip();
		await interaction.followUp({
			content: `Playing clip (1/${manager.clipNumber})`,
			components: [
				createButtons({
					nextSong: false,
					lastClip: manager.currentPlayedItems.length > 0,
				}),
			],
		});
	},
} as BasicCommandFile;
