import yts from "yt-search";
import { error } from "../log";

export function extractYouTubePlaylistId(url: string) {
	if (!url) return false;
	const regex =
		/^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/(playlist\?|watch\?(?:.*&)?list=)([a-zA-Z0-9_-]+)(?:&.*)?$/;
	const match = regex.exec(url);

	if (match && match[5]) {
		// match[5] corresponds to the 5th capturing group, which is the playlist ID
		return match[5];
	}
	return null;
}

export async function getVideoIdsFromPlaylist(playlistId: string) {
	try {
		const result = await yts({ listId: playlistId });
		return result.videos.map((v) => v.videoId);
	} catch (err) {
		error("Error fetching YouTube playlist info:", err);
		return null;
	}
}

export function completeUrl(videoId: string) {
	return `https://www.youtube.com/watch?v=${videoId}`;
}
