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
	preparedBuffer,
	clipLength = 5,
	clipNumbers = 3,
}: {
	id: string;
	preparedBuffer?: Buffer;
	clipLength?: number;
	clipNumbers?: number;
}): Promise<{ resources: PlayingResource[]; buffer: Buffer }> {
	const buffer = preparedBuffer ?? (await getVideo(id));
	const metadata = await getMetadata(Readable.from(buffer));
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
	return {
		buffer,
		resources: await Promise.all(
			timemarks.map(
				async ([startTime, endTime]) =>
					({
						buffer: await clipAudio(Readable.from(buffer), [
							startTime,
							endTime,
						]).buffer,
						duration: [startTime, endTime],
						id,
						totalDuration,
					}) as PlayingResource,
			),
		),
	};
}

export function prepareAudioResource(buffer: Buffer) {
	return createAudioResource(Readable.from(buffer), {
		inlineVolume: true,
	});
}
