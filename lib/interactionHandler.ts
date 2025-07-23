import { ButtonInteraction, MessageFlags } from "discord.js";
import { ButtonIds, createButtons } from "./action";
import { error } from "./log";
import { readableSong } from "./utils";
import {
	hasSessionManager,
	getSessionManager,
	destroySessionManager,
} from "./voice/session";
import { searchVideo } from "./youtube/core";

export default async function buttonInteractionHandler(
	interaction: ButtonInteraction,
) {
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
		await interaction.message.delete().catch();
	}
	switch (interaction.customId) {
		case ButtonIds.LastClip: {
			if (manager.currentPlayedItems.length === 0) {
				return await interaction.reply({
					content: "No clips have been played yet.",
					flags: [MessageFlags.Ephemeral],
				});
			}
			if (manager.playLastClip()) {
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
			if (manager.playNextClip()) {
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
				const lastMeta = await searchVideo(lastId);
				if (!lastMeta) {
					return await interaction.editReply({
						content: "Failed to fetch metadata for the last song.",
					});
				}

				return await interaction.editReply({
					content: readableSong(lastMeta, manager),
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
			manager.playCurrentClip();
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
			manager.playCurrentClip();
			break;
		}
		case ButtonIds.Skip: {
			if (manager.currentItem) {
				await interaction.deferReply();
				const lastId = manager.currentItem.id;
				const lastMeta = await searchVideo(lastId);
				if (!lastMeta) {
					return await interaction.editReply({
						content: "Failed to fetch metadata for the last song.",
					});
				}

				await interaction.editReply({
					content: readableSong(lastMeta, manager),
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
