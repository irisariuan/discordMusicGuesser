//TODO: implement download functionality faciliting ytdlp and ffmpeg to clip videos
import { spawn } from "child_process";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { stat, readdir, unlink } from "fs/promises";
import { readFile } from "fs/promises";
import { join } from "path";
import { type Readable } from "stream";
import { pipeline } from "stream/promises";

export const audioPromiseQueue: Promise<void>[] = [];

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

export function download(videoId: string, showLog = false) {
	const proc = spawn(
		"yt-dlp",
		[
			`"${videoId}"`,

			"--format",
			"bestaudio",

			"--add-metadata",
			"--no-playlist",
			"--force-ipv4",

			"-o",
			"-",
		],
		{
			shell: true,
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	if (showLog) {
		proc.stderr.on("data", (data) => {
			const decoder = new TextDecoder();
			const errorMessage = decoder.decode(data);
			console.log(errorMessage);
		});
	}
	const writable = createWriteStream(createFilePath(videoId));
	let buffer = Buffer.from([]);
	proc.stdout.on("data", (data) => {
		buffer = Buffer.concat([buffer, data]);
	});
	const promise = pipeline(proc.stdout, writable);
	audioPromiseQueue.push(promise);
	audioPromiseQueue.push(checkFolderSize());
	return {
		stdout: proc.stdout,
		buffer: new Promise<Buffer>((resolve, reject) => {
			proc.stdout.once("close", async () => {
				await promise;
				if (buffer.length <= 0) {
					console.error(`Failed to download video: ${videoId}`);
					unlink(createFilePath(videoId)).catch((err) => {
						console.error(
							`Failed to delete empty file: ${videoId}`,
							err,
						);
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

export async function getVideo(
	videoId: string,
	showLog = false,
): Promise<Buffer> {
	const filePath = createFilePath(videoId);
	if (existsSync(filePath)) {
		if (showLog) {
			console.log(`Hit cache: ${filePath}`);
		}
		const buffer = await readFile(filePath);
		if (buffer.length === 0) {
			return download(videoId, showLog).buffer;
		}
		return buffer;
	}
	return await download(videoId, showLog).buffer;
}

export function clipAudio(
	source: Readable,
	period: [number, number],
	showLog = false,
) {
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
			console.log(errorMessage);
		});
	}

	pipeline(source, proc.stdin).catch((err) => {
		if (err.code !== "EPIPE") {
			console.error(err);
			throw err;
		}
	});

	let buffer = Buffer.from([]);
	proc.stdout.on("data", (buf) => {
		buffer = Buffer.concat([buffer, buf]);
	});
	const promise = new Promise<Buffer>((resolve) =>
		proc.stdout.on("close", () => {
			resolve(buffer);
		}),
	);
	return { buffer: promise, stdout: proc.stdout };
}

interface VideoMetadata {
	format: {
		duration: number;
		bit_rate: number;
	};
}

export function getMetadata(
	source: Readable,
	showLog = false,
): Promise<VideoMetadata> {
	const args = ["-print_format", "json", "-show_format", "-"];

	const proc = spawn("ffprobe", args, {
		shell: true,
		stdio: ["pipe", "pipe", "pipe"],
	});
	const decoder = new TextDecoder();
	if (showLog) {
		proc.stderr.on("data", (data) => {
			const errorMessage = decoder.decode(data);
			console.log(errorMessage);
		});
	}
	let allData = "";
	source.pipe(proc.stdin);
	proc.stdout.on("data", (data) => {
		allData += decoder.decode(data);
	});
	return new Promise<VideoMetadata>((resolve, reject) => {
		proc.on("close", (code) => {
			if (code !== 0) {
				console.error(`ffprobe process exited with code ${code}`);
				return reject(new Error(`ffprobe exited with code ${code}`));
			}
			try {
				const metadata: VideoMetadata = JSON.parse(allData);
				if (showLog) {
					console.log("Video Metadata:", metadata);
				}
				resolve(metadata);
			} catch (error) {
				console.error("Failed to parse metadata:", error);
				reject(error);
			}
		});
		proc.on("error", (error) => {
			reject(error);
		});
	});
}

export async function checkFolderSize() {
	let size;
	do {
		({ size } = await stat(join(process.cwd(), "downloads")));
		if (size > 100 * 1024 * 1024) {
			// 100 MB
			console.log("Downloads folder size exceeds 100 MB, cleaning up...");
			const files = await readdir(join(process.cwd(), "downloads"));
			for (const file of files) {
				const filePath = join(process.cwd(), "downloads", file);
				await unlink(filePath);
				console.log(`Deleted: ${filePath}`);
			}
		}
	} while (size > 100 * 1024 * 1024);
}
