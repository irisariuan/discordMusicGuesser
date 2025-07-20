import { createAudioResource } from "@discordjs/voice";
import { Readable } from "stream";
import { randomFloat, roundTo } from "../utils";
import { clipAudio, getMetadata, getVideo } from "./fs";
import {
	calculateCutDuration,
	calculateRealTimemark,
	calculateSegmentDurations,
	getSegments,
} from "../youtube/segments";

export interface PlayingResource {
	buffer: Buffer;
	id: string;
	duration: [number, number];
	totalDuration: number;
}

export async function prepareRandomClips({
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
	const buffer = await getVideo(id, showLog);
	const metadata = await getMetadata(Readable.from(buffer), showLog);
	const totalDuration = metadata.format.duration;

	const segments = await getSegments(id);
	const segmentTimemarks = segments
		? calculateSegmentDurations(segments, totalDuration)
		: null;
	const clippedDuration = segments
		? calculateCutDuration(
				totalDuration,
				segments.map((v) => v.segment),
			)
		: totalDuration;

	const timemarks: [number, number][] = [];
	for (let i = 0; i < clipNumbers; i++) {
		const minStartTime = (clippedDuration / clipNumbers) * i;
		const maxEndTime =
			(clippedDuration / clipNumbers) * (i + 1) - clipLength <
			minStartTime
				? (clippedDuration / clipNumbers) * (i + 1)
				: (clippedDuration / clipNumbers) * (i + 1) - clipLength;
		const startTime = roundTo(randomFloat(minStartTime, maxEndTime));
		const endTime = roundTo(
			Math.min(startTime + clipLength, clippedDuration),
		);
		
		timemarks.push(
			segmentTimemarks
				? [
						calculateRealTimemark(startTime, segmentTimemarks),
						calculateRealTimemark(endTime, segmentTimemarks),
					]
				: [startTime, endTime],
		);
	}
	return Promise.all(
		timemarks.map(
			async ([startTime, endTime]) =>
				({
					buffer: await clipAudio(
						Readable.from(buffer),
						[startTime, endTime],
						showLog,
					).buffer,
					duration: [startTime, endTime],
					id,
					totalDuration,
				}) as PlayingResource,
		),
	);
}

export function prepareAudioResource(buffer: Buffer) {
	return createAudioResource(Readable.from(buffer), {
		inlineVolume: true,
	});
}
