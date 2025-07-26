import yts from "yt-search";
import { error, warn } from "../log";
import NodeCache from "node-cache";
import { ask } from "../ai/core";

const searchCache = new NodeCache({ stdTTL: 60 * 60 * 24 });
const searchIdCache = new NodeCache({ stdTTL: 60 * 60 * 24 });

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

export async function getVideoIdsByPlaylistId(playlistId: string) {
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

export async function searchVideoById(
	videoId: string,
): Promise<yts.VideoMetadataResult | null> {
	try {
		const cached = searchIdCache.get(videoId);
		if (cached) {
			return cached as yts.VideoMetadataResult;
		}
		const fetched = await yts({ videoId });
		searchIdCache.set(videoId, fetched);
		return fetched;
	} catch {
		return null;
	}
}

export async function searchVideos(query: string) {
	try {
		const cached = searchCache.get(query);
		if (cached) {
			return cached as yts.SearchResult;
		}
		const fetched = await yts(query);
		if (fetched.videos.length === 0) {
			warn("No videos found for the query:", query);
			return null;
		}
		searchCache.set(query, fetched);
		return fetched;
	} catch (err) {
		error("Error fetching YouTube video metadata for query:", query, err);
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

export async function compareGuess(
	guess: string,
	answerId: string,
	useAi: false,
): Promise<number | null>;
export async function compareGuess(
	guess: string,
	answerId: string,
	useAi: true,
): Promise<boolean | null>;
export async function compareGuess(
	guess: string,
	answerId: string,
	useAi: boolean,
): Promise<number | boolean | null> {
	if (useAi) {
		const answer = await searchVideoById(answerId);
		if (!answer) {
			error("Failed to fetch video metadata for the answer");
			return null;
		}
		const response = await ask(
			`Guess: ${guess}\nAnswer: ${answer?.title}`,
			"Compare the guess with the answer and return true if they are the same song, otherwise return false. Guess and answer maybe in different languages. Return only true or false.",
		);
		if (!response) return null;
		return response.toLowerCase() === "true";
	}
	const search = await searchVideos(guess);
	if (!search || !search.videos || search.videos.length === 0) {
		error("Failed to fetch video metadata for the guess");
		return null;
	}
	const index = search.videos.findIndex(
		(video) => video.videoId === answerId,
	);
	if (index <= -1) return null;
	return (search.videos.length - index) / search.videos.length; // 0 - 1, where 1 is the best match
}
