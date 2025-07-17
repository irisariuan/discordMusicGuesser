//TODO: implement download functionality faciliting ytdlp and ffmpeg to clip videos
import { spawn } from "child_process";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { Transform, type Readable } from "stream";
import { pipeline } from "stream/promises";

export const downloadPromiseQueue: Promise<void>[] = [];

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
	const transform = new Transform();
	const writable = createWriteStream(createFilePath(videoId));
	proc.stdout.on("data", (data) => {
		transform.push(data);
	});
	const promise = pipeline(proc.stdout, writable);
	downloadPromiseQueue.push(promise);
	return { promise, transform };
}

export function clipAudio(source: Readable, period: [number, number]) {
	const args = [
		"-i",
		"-",
		"-ss",
		period[0].toString(),
		"-to",
		period[1].toString(),
		"-c",
		"copy",
		"-f",
		"opus",
		"-v",
		"quiet",
		"pipe:1",
	];

	const proc = spawn("ffmpeg", args, {
		shell: true,
		stdio: ["pipe", "pipe", "inherit"],
	});

	source.pipe(proc.stdin);
	return proc.stdout;
}

interface VideoMetadata {
	format: {
		duration: number;
		bit_rate: number;
	};
}

export function getMetadata(source: Readable): Promise<VideoMetadata> {
	const args = ["-v", "quiet", "-print_format", "json", "-show_format", "-"];

	const proc = spawn("ffprobe", args, {
		shell: true,
		stdio: ["pipe", "pipe", "inherit"],
	});
	const decoder = new TextDecoder();
	let allData = "";
	source.pipe(proc.stdin);
	proc.stdout.on("data", (data) => {
		allData += decoder.decode(data);
	});
	return new Promise<VideoMetadata>((resolve, reject) => {
		proc.on("close", (code) => {
			if (code !== 0) {
				console.error(`ffprobe process exited with code ${code}`);
			}
			resolve(JSON.parse(allData));
		});
		proc.on("error", (error) => {
			reject(error);
		});
	});
}
