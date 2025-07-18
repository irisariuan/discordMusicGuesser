import { AudioResource, createAudioResource } from "@discordjs/voice";
import { Readable } from "stream";
import { clipAudio, getMetadata, getVideo } from "./fs";
import { randomNumber, roundTo } from "../utils";

export interface PlayingResource {
	buffer: Buffer;
	id: string;
	duration: [number, number];
	totalDuration: number;
}

export async function prepareClipsResourceById({
	id,
	clipLength = 5,
	clipNumbers = 3,
	showLog = false,
}: {
	id: string;
	clipLength?: number;
	clipNumbers?: number;
	showLog?: boolean;
}): Promise<PlayingResource[]> {
	const awaitedBuffer = await getVideo(id, showLog);
	const metadata = await getMetadata(Readable.from(awaitedBuffer), showLog);
	const totalDuration = metadata.format.duration;
	const resources: PlayingResource[] = [];
	for (let i = 0; i < clipNumbers; i++) {
		const minStartTime = (totalDuration / clipNumbers) * i;
		const maxEndTime =
			(totalDuration / clipNumbers) * (i + 1) - clipLength < minStartTime
				? (totalDuration / clipNumbers) * (i + 1)
				: (totalDuration / clipNumbers) * (i + 1) - clipLength;
		const startTime = roundTo(randomNumber(minStartTime, maxEndTime));
		const endTime = roundTo(
			Math.min(startTime + clipLength, totalDuration),
		);
		console.log("Clipping", startTime, endTime);
		const { buffer: clipBuffer } = clipAudio(
			Readable.from(awaitedBuffer),
			[startTime, endTime],
			showLog,
		);
		resources.push({
			duration: [startTime, endTime],
			totalDuration,
			buffer: await clipBuffer,
			id,
		});
	}
	return resources;
}

export function prepareResource(buffer: Buffer) {
	return createAudioResource(Readable.from(buffer), {
		inlineVolume: true,
	});
}
