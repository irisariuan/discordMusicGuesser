import z from "zod";
import { log, error, warn } from "../log";

export enum SegmentCategory {
	Sponsor = "sponsor",
	SelfPromotion = "selfpromo",
	Interaction = "interaction",
	Intro = "intro",
	Outro = "outro",
	Preview = "preview",
	MusicOffTopic = "music_offtopic",
	Filler = "filler",
}
export const segmentSchema = z.object({
	category: z.enum(SegmentCategory),
	segment: z.number().min(0).array().length(2),
	videoDuration: z.number().min(0),
	UUID: z.string(),
	locked: z.int(),
	votes: z.int(),
	description: z.string(),
});
export const segmentsSchema = z.array(segmentSchema);
export type Segment = { segment: [number, number] } & z.infer<
	typeof segmentSchema
>;

export async function getSegments(
	id: string,
	categories: SegmentCategory[] = Object.values(SegmentCategory),
): Promise<Segment[] | null> {
	const url = new URL("https://sponsor.ajay.app/api/skipSegments");
	url.searchParams.set("videoID", id);
	url.searchParams.set(
		"categories",
		`[${categories.map((v) => `"${v}"`).join(",")}]`,
	);
	const res = await fetch(url);
	if (!res.ok) {
		warn(
			`Failed to fetch ${id} with categories ${categories.join()}, Text:`,
			await res.text(),
		);
		return null;
	}
	const result = await segmentsSchema
		.parseAsync(await res.json().catch(() => null))
		.catch(() => null);
	if (!result) {
		error(`Failed to parse segments for ${id}`);
		return null;
	}
	return result.filter(
		(v): v is Segment =>
			v.segment[0] !== undefined && v.segment[1] !== undefined,
	);
}

export function calculateCutDuration(
	totalDuration: number,
	skippedSegments: [number, number][],
) {
	return (
		totalDuration -
		skippedSegments.reduce(
			(prev, cur) => Math.abs(cur[1] - cur[0]) + prev,
			0,
		)
	);
}

export function calculateSegmentDurations(
	segments: Segment[],
	totalDuration: number,
): SegmentDuration[] {
	const segmentTimemarks: SegmentDuration[] = [];
	let lastEnd = 0;
	let time = 0;
	for (const segment of segments) {
		const [start, end] = segment.segment;
		if (start > lastEnd) {
			// If there's a gap between segments, add a non-skipped segment
			time += start - lastEnd;
			segmentTimemarks.push({
				duration: start - lastEnd,
				skipped: false,
			});
		}
		const duration = end - start;
		if (duration <= 0) {
			throw new Error(
				`Invalid segment duration for ${segment.UUID}: ${duration} seconds`,
			);
		}
		time += duration;
		segmentTimemarks.push({
			duration,
			skipped: true,
		});
	}
	if (time < totalDuration) {
		// If there's remaining time after the last segment, add it as a non-skipped
		segmentTimemarks.push({
			duration: totalDuration - time,
			skipped: false,
		});
	}
	return segmentTimemarks;
}

interface SegmentDuration {
	duration: number;
	skipped: boolean;
}

export function calculateRealTimemark(
	timemark: number,
	segments: SegmentDuration[],
) {
	let totalDuration = 0;
	let unskippedDuration = 0;
	for (const segment of segments) {
		if (
			!segment.skipped &&
			timemark >= unskippedDuration &&
			timemark <= unskippedDuration + segment.duration
		) {
			// If the timemark falls within this segment
			return totalDuration + (timemark - unskippedDuration);
		}
		totalDuration += segment.duration;
		if (!segment.skipped) {
			unskippedDuration += segment.duration;
		}
	}
	return -1;
}
