//TODO: implement download functionality faciliting ytdlp and ffmpeg to clip videos
import { spawn } from "child_process";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { stat, readdir, unlink } from "fs/promises";
import { readFile } from "fs/promises";
import { join } from "path";
import { type Readable } from "stream";
import { pipeline } from "stream/promises";
import { error, debug, important } from "../log";
import { flags } from "../shared";
import { doubleDash, singleDash } from "../env/flag";
import { completeUrl } from "../youtube/core";

export const audioPromiseQueue: Promise<void>[] = [];

const showLog = flags.getFlagValue(
	[singleDash("D"), singleDash("B"), doubleDash("debug")],
	true,
);

function epipeCatcher(
	err: NodeJS.ErrnoException,
	callbackFunction: () => unknown = () => {
		throw err;
	},
) {
	debug("Piping exception", err.code);
	if (err.code !== "EPIPE") {
		callbackFunction();
	}
}

export interface DownloadedItem {
	lengthInSeconds: number;
	url: string;
}

function createFilePath(id: string) {
	if (!existsSync(join(process.cwd(), "downloads"))) {
		mkdirSync(join(process.cwd(), "downloads"));
	}
	return join(process.cwd(), "downloads", `${id}.webm`);
}

export function download(videoId: string) {
	const proc = spawn(
		"yt-dlp",
		[
			completeUrl(videoId),

			"--format",
			"bestaudio",

			"--add-metadata",
			"--no-playlist",
			"--force-ipv4",

			"-o",
			"-",
		],
		{
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	if (showLog) {
		proc.stderr.on("data", (data) => {
			const decoder = new TextDecoder();
			const errorMessage = decoder.decode(data);
			debug(errorMessage);
		});
	}
	const writable = createWriteStream(createFilePath(videoId));
	let buffer = Buffer.from([]);
	proc.stdout.on("data", (data) => {
		buffer = Buffer.concat([buffer, data]);
	});
	const promise = pipeline(proc.stdout, writable).catch(epipeCatcher);
	audioPromiseQueue.push(promise);
	return {
		stdout: proc.stdout,
		buffer: new Promise<Buffer>((resolve, reject) => {
			proc.stdout.once("close", async () => {
				await promise;
				if (buffer.length <= 0) {
					error(`Failed to download video: ${videoId}`);
					unlink(createFilePath(videoId)).catch((err) => {
						error(`Failed to delete empty file: ${videoId}`, err);
					});
					return reject(
						new Error(`Failed to download video: ${videoId}`),
					);
				}
				resolve(buffer);
			});
		}),
	};
}

export async function getVideo(videoId: string): Promise<Buffer> {
	const filePath = createFilePath(videoId);
	if (existsSync(filePath)) {
		if (showLog) {
			debug(`Hit cache: ${filePath}`);
		}
		const buffer = await readFile(filePath).catch(() => null);
		if (!buffer || buffer.length === 0) {
			return await download(videoId).buffer;
		}
		return buffer;
	}
	return await download(videoId).buffer;
}

export function clipAudio(source: Readable, period: [number, number]) {
	if (period[0] < 0 || period[1] < 0) {
		throw new Error("Period start and end must be non-negative.");
	}

	const args = [
		"-i",
		"pipe:0",
		"-ss",
		period[0].toString(),
		"-to",
		period[1].toString(),
		"-c",
		"copy",
		"-f",
		"webm",
		"pipe:1",
	];

	const proc = spawn("ffmpeg", args, {
		stdio: ["pipe", "pipe", "pipe"],
	});

	if (showLog) {
		const decoder = new TextDecoder();
		proc.stderr.on("data", (data) => {
			const errorMessage = decoder.decode(data);
			debug(errorMessage);
		});
	}

	let buffer = Buffer.from([]);
	proc.stdout.on("data", (buf) => {
		buffer = Buffer.concat([buffer, buf]);
	});

	const promise = new Promise<Buffer>((resolve) =>
		proc.stdout.on("close", () => {
			resolve(buffer);
		}),
	);

	pipeline(source, proc.stdin).catch(epipeCatcher);
	return { buffer: promise, stdout: proc.stdout };
}

interface VideoMetadata {
	format: {
		duration: number;
		bit_rate: number;
	};
}

export function getMetadata(source: Readable): Promise<VideoMetadata> {
	const args = ["-print_format", "json", "-show_format", "-"];

	const proc = spawn("ffprobe", args, {
		stdio: ["pipe", "pipe", "pipe"],
	});
	const decoder = new TextDecoder();
	if (showLog) {
		proc.stderr.on("data", (data) => {
			const errorMessage = decoder.decode(data);
			debug(errorMessage);
		});
	}
	let allData = "";
	pipeline(source, proc.stdin).catch(epipeCatcher);
	proc.stdout.on("data", (data) => {
		allData += decoder.decode(data);
	});
	return new Promise<VideoMetadata>((resolve, reject) => {
		proc.on("close", (code) => {
			if (code !== 0) {
				error(`ffprobe process exited with code ${code}`);
				return reject(new Error(`ffprobe exited with code ${code}`));
			}
			try {
				const metadata: VideoMetadata = JSON.parse(allData);
				if (showLog) {
					debug("Video Metadata:", metadata);
				}
				resolve(metadata);
			} catch (err) {
				error("Failed to parse metadata:", err);
				reject(err);
			}
		});
		proc.on("error", (err) => reject(err));
	});
}

export async function checkFolderSize() {
	const { size } = await stat(join(process.cwd(), "downloads"));
	if (size > 100 * 1024 * 1024) {
		// 100 MB
		important("Downloads folder size exceeds 100 MB, cleaning up...");
		const files = await readdir(join(process.cwd(), "downloads"));
		for (const file of files) {
			const filePath = join(process.cwd(), "downloads", file);
			await unlink(filePath);
			important(`Deleted: ${filePath}`);
			const { size } = await stat(join(process.cwd(), "downloads"));
			if (size <= 30 * 1024 * 1024) {
				// 30 MB
				important(
					"Downloads folder size is now below 30 MB, stopping cleanup.",
				);
				return;
			}
		}
	}
}
