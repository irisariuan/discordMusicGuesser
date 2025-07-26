import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export enum ButtonIds {
	LastClip = "last",
	NextClip = "next",
	NextSong = "nextsong",
	Replay = "replay",
	Skip = "skip",
}

export function createButtons({
	nextSong,
	lastClip,
}: {
	nextSong: boolean;
	lastClip: boolean;
}) {
	const lastClipBtn = new ButtonBuilder()
		.setCustomId(ButtonIds.LastClip)
		.setLabel("⬅️ Last Clip")
		.setStyle(ButtonStyle.Primary);
	const nextClipBtn = new ButtonBuilder()
		.setCustomId(ButtonIds.NextClip)
		.setLabel("➡️ Next Clip")
		.setStyle(ButtonStyle.Primary);

	const nextSongBtn = new ButtonBuilder()
		.setCustomId(ButtonIds.NextSong)
		.setLabel("⏭️ Next Song")
		.setStyle(ButtonStyle.Primary);

	const skipBtn = new ButtonBuilder()
		.setCustomId(ButtonIds.Skip)
		.setLabel("⏭️ Skip")
		.setStyle(ButtonStyle.Danger);

	const replayBtn = new ButtonBuilder()
		.setCustomId(ButtonIds.Replay)
		.setLabel("🔁 Replay")
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder<ButtonBuilder>();
	if (lastClip) {
		row.addComponents(lastClipBtn);
	}
	if (nextSong) {
		row.addComponents(nextSongBtn);
	} else {
		row.addComponents(nextClipBtn, skipBtn);
	}
	row.addComponents(replayBtn);
	return row;
}
