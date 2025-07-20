import { Events, MessageFlags } from "discord.js";
import {
	getAllRegisteredCommandNames,
	registerCommands,
} from "./lib/commands/register";
import { DEV, DEV_TOKEN, TOKEN } from "./lib/env/env";
import { doubleDash, singleDash } from "./lib/env/flag";
import { client, flags, manager } from "./lib/shared";
import { compareArraysContent } from "./lib/utils";
import { audioPromiseQueue } from "./lib/voice/fs";
import { ButtonIds, createButtons } from "./lib/action";
import {
	destroySessionManager,
	getSessionManager,
	hasSessionManager,
} from "./lib/voice/session";
import yts from "yt-search";
import { completeUrl } from "./lib/youtube/core";
import { log, error } from "./lib/log";

if (flags.getAllFlags().length > 0) {
	for (const flag of flags.getAllFlags()) {
		log(`${flag.name} : ${flag.value ?? "(NO VALUE)"}`);
	}
}

if (
	!compareArraysContent(
		(await getAllRegisteredCommandNames()) ?? [],
		manager.getAllCommandNames(),
	) ||
	flags.getFlagValue(
		[doubleDash("refreshCommands"), singleDash("R")],
		true,
	) === true
) {
	if (
		flags.getFlagValue(
			[doubleDash("refreshCommands"), singleDash("R")],
			true,
		) === true
	) {
		log("Refreshing commands...");
	} else {
		log("Command files change detected, refreshing...");
	}
	await registerCommands(manager.getAllCommands());
	log("Commands registered successfully");
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isButton()) {
		if (!interaction.guildId || !hasSessionManager(interaction.guildId)) {
			return await interaction.update({ withResponse: false });
		}
		const manager = getSessionManager(interaction.guildId);
		if (!manager) {
			error(`No session manager found for guild ${interaction.guildId}`);
			return await interaction.update({ withResponse: false });
		}
		if (manager.preparingResources) {
			return await interaction.update({ withResponse: false });
		}
		if (interaction.message.deletable) {
			await interaction.message.delete();
		}
		switch (interaction.customId) {
			case ButtonIds.LastClip: {
				if (manager.currentPlayedItems.length === 0) {
					return await interaction.reply({
						content: "No clips have been played yet.",
						flags: [MessageFlags.Ephemeral],
					});
				}
				if (await manager.playLastClip()) {
					return await interaction.reply({
						content: `Playing the last played clip (${manager.clipNumber - manager.currentQueue.length}/${manager.clipNumber})`,
						components: [
							createButtons({
								lastClip: manager.currentPlayedItems.length > 0,
								nextSong: false,
							}),
						],
					});
				}
				break;
			}
			case ButtonIds.NextClip: {
				if (await manager.playNextClip()) {
					return await interaction.reply({
						content: `Playing the next clip (${manager.clipNumber - manager.currentQueue.length}/${manager.clipNumber})`,
						components: [
							createButtons({
								lastClip: manager.currentPlayedItems.length > 0,
								nextSong: false,
							}),
						],
					});
				}
				await interaction.deferReply();
				if (manager.currentItem) {
					const lastId = manager.currentItem.id;
					const lastMeta = await yts({ videoId: lastId }).catch(
						() => null,
					);
					if (!lastMeta) {
						return await interaction.editReply({
							content:
								"Failed to fetch metadata for the last song.",
						});
					}

					return await interaction.editReply({
						content: `Last song is ${lastMeta.title} (${completeUrl(lastId)})`,
						components: [
							createButtons({
								lastClip: manager.currentPlayedItems.length > 0,
								nextSong: true,
							}),
						],
					});
				}
				break;
			}
			case ButtonIds.Replay: {
				await manager.playCurrentClip();
				return await interaction.reply({
					content: `Replaying the last played clip (${manager.clipNumber - manager.currentQueue.length}/${manager.clipNumber})`,
					components: [
						createButtons({
							lastClip: manager.currentPlayedItems.length > 0,
							nextSong: false,
						}),
					],
				});
				break;
			}
			case ButtonIds.NextSong: {
				await interaction.deferReply();
				if (!(await manager.nextSong())) {
					await interaction.editReply({
						content: "No more songs in the queue.",
					});
					return destroySessionManager(interaction.guildId);
				}
				await interaction.editReply({
					content: `Playing clip (1/${manager.clipNumber})`,
					components: [
						createButtons({
							lastClip: manager.currentPlayedItems.length > 0,
							nextSong: false,
						}),
					],
				});
				await manager.playCurrentClip();
				break;
			}
			case ButtonIds.Skip: {
				if (manager.currentItem) {
					await interaction.deferReply();
					const lastId = manager.currentItem.id;
					const lastMeta = await yts({ videoId: lastId }).catch(
						() => null,
					);
					if (!lastMeta) {
						return await interaction.editReply({
							content:
								"Failed to fetch metadata for the last song.",
						});
					}

					await interaction.editReply({
						content: `Last song is ${lastMeta.title} (${completeUrl(lastId)})`,
						components: [
							createButtons({
								lastClip: false,
								nextSong: true,
							}),
						],
					});
				}
				break;
			}
			default: {
				return await interaction.reply({
					content: "This button is not implemented yet.",
					flags: [MessageFlags.Ephemeral],
				});
			}
		}
	}
	if (!interaction.isChatInputCommand()) return;
	const command = manager.getCommand(interaction.commandName);
	if (!command) {
		return await interaction.reply({
			content: "This command does not exist.",
			flags: [MessageFlags.Ephemeral],
		});
	}
	Promise.try(() => command.execute(interaction)).catch((error) => {
		error("Error executing command:", error);
		interaction
			.reply({
				content: "There was an error while executing this command.",
				flags: [MessageFlags.Ephemeral],
			})
			.catch(() => error("Failed to send error message"));
	});
});

client.on(Events.ClientReady, () => {
	log("Bot started");
});

client.login(DEV ? DEV_TOKEN : TOKEN);

process.on("uncaughtException", (err) => {
	error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (err) => {
	error("Unhandled Rejection:", err);
});

process.on("SIGINT", () => {
	log("Type /exit to exit");
});

process.stdin.on("data", async (data) => {
	const textDecoder = new TextDecoder();
	const input = textDecoder.decode(data).trim();
	switch (input) {
		case "/exit":
			log("Exiting...");
			await client.destroy();
			log("Awaiting all downloads to finish...");
			await Promise.all(audioPromiseQueue);
			log("All downloads finished.");
			log("Goodbye!");
			process.exit(0);
			break;
	}
});
