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
import { completeUrl } from "./lib/youtube";

if (flags.getAllFlags().length > 0) {
	for (const flag of flags.getAllFlags()) {
		console.log(`${flag.name} : ${flag.value ?? "(NO VALUE)"}`);
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
		console.log("Refreshing commands...");
	} else {
		console.log("Command files change detected, refreshing...");
	}
	await registerCommands(manager.getAllCommands());
	console.log("Commands registered successfully");
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isButton()) {
		if (!interaction.guildId || !hasSessionManager(interaction.guildId)) {
			return interaction.reply({
				content: "Unknown interaction",
				flags: [MessageFlags.Ephemeral],
			});
		}
		const manager = getSessionManager(interaction.guildId);
		if (!manager) {
			throw new Error(
				`No session manager found for guild ${interaction.guildId}`,
			);
		}
		if (manager.preparingResources) {
			return await interaction.deferUpdate();
		}
		if (interaction.message.deletable) {
			await interaction.message.delete();
		}
		switch (interaction.customId) {
			case ButtonIds.LastClip: {
				if (manager.currentPlayedItems.length === 0) {
					return interaction.reply({
						content: "No clips have been played yet.",
						flags: [MessageFlags.Ephemeral],
					});
				}
				if (await manager.playLastClip()) {
					return interaction.reply({
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
					return interaction.reply({
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
						return interaction.editReply({
							content:
								"Failed to fetch metadata for the last song.",
						});
					}

					return interaction.editReply({
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
				return interaction.reply({
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
						return interaction.editReply({
							content:
								"Failed to fetch metadata for the last song.",
						});
					}

					interaction.editReply({
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
				return interaction.reply({
					content: "This button is not implemented yet.",
					flags: [MessageFlags.Ephemeral],
				});
			}
		}
	}
	if (!interaction.isChatInputCommand()) return;
	const command = manager.getCommand(interaction.commandName);
	if (!command) {
		return interaction.reply({
			content: "This command does not exist.",
			flags: [MessageFlags.Ephemeral],
		});
	}
	Promise.try(() => command.execute(interaction)).catch((error) => {
		console.error("Error executing command:", error);
		interaction
			.reply({
				content: "There was an error while executing this command.",
				flags: [MessageFlags.Ephemeral],
			})
			.catch(() => console.error("Failed to send error message"));
	});
});

client.on(Events.ClientReady, () => {
	console.log("Bot started");
});

client.login(DEV ? DEV_TOKEN : TOKEN);

process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (err) => {
	console.error("Unhandled Rejection:", err);
});

process.on("SIGINT", () => {
	console.log("Type /exit to exit");
});

process.stdin.on("data", async (data) => {
	const textDecoder = new TextDecoder();
	const input = textDecoder.decode(data).trim();
	switch (input) {
		case "/exit":
			console.log("Exiting...");
			await client.destroy();
			console.log("Awaiting all downloads to finish...");
			await Promise.all(audioPromiseQueue);
			console.log("All downloads finished.");
			console.log("Goodbye!");
			process.exit(0);
			break;
	}
});
