import yts from "yt-search";
import { error, warn } from "../log";
import NodeCache from "node-cache";

const searchCache = new NodeCache({ stdTTL: 60 * 60 * 24 });

export function extractYouTubePlaylistId(url: string) {
	if (!url) return null;
	const regex =
		/^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/(playlist\?|watch\?(?:.*&)?)(list=)([a-zA-Z0-9_-]+)(?:&.*)?$/;
	const match = regex.exec(url);

	if (match && match[6]) {
		// match[6] corresponds to the 6th capturing group, which is the playlist ID
		return match[6];
	}
	return null;
}

export async function getVideoIdsFromPlaylist(playlistId: string) {
	const result = await searchPlaylist(playlistId);
	if (!result) {
		error("Error fetching YouTube playlist info");
		return null;
	}
	return result.videos.map((v) => v.videoId);
}

export function completeUrl(videoId: string) {
	return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function searchVideo(
	videoId: string,
): Promise<yts.VideoMetadataResult | null> {
	try {
		const cached = searchCache.get(videoId);
		if (cached) {
			return cached as yts.VideoMetadataResult;
		}
		const fetched = await yts({ videoId });
		searchCache.set(videoId, fetched);
		return fetched;
	} catch {
		return null;
	}
}

// Playlist has limit of 100 videos per request, need to change library if wanted to fetch full playlist
export async function searchPlaylist(playlistId: string) {
	try {
		const cached = searchCache.get(playlistId);
		if (cached) {
			return cached as yts.PlaylistMetadataResult;
		}
		const fetched = await yts({ listId: playlistId });
		if (fetched.videos.length !== fetched.size) {
			warn(
				`Fetched videos length does not match its size, ${fetched.videos.length} (Response length) != ${fetched.size} (Size)`,
			);
		}
		searchCache.set(playlistId, fetched);
		return fetched;
	} catch {
		return null;
	}
}
