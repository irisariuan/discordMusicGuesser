import { VideoMetadataResult } from "yt-search";
import { SessionManager } from "../voice/session";

export function readableSong(
	song: VideoMetadataResult,
	manager: SessionManager,
) {
	if (!manager.currentItem) {
		return "No song is currently playing.";
	}
	return `Current song is **${song.title}** by *${song.author.name}* (${song.url})\nClip timestamps are ${manager.currentQueue
		.concat(...manager.currentPlayedItems, manager.currentItem)
		.sort((a, b) => a.duration[0] - b.duration[0])
		.map(
			(c) =>
				`\`${readableTimestamp(c.duration[0])} - ${readableTimestamp(c.duration[1])}\``,
		)
		.join(", ")}`;
}
export function readableTimestamp(duration: number) {
	const hours = Math.floor(duration / 3600);
	const minutes = Math.floor((duration % 3600) / 60);
	const seconds = Math.floor(duration % 60);
	const miliseconds = Math.floor((duration % 1) * 10);

	const parts: string[] = [];
	if (hours > 0) {
		parts.push(hours.toString().padStart(2, "0"));
	}
	parts.push(minutes.toString().padStart(2, "0"));
	parts.push(seconds.toString().padStart(2, "0"));

	return parts.join(":").concat(".", miliseconds.toString().padEnd(2, "0"));
}
