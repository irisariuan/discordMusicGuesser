import {
	createAudioPlayer,
	PlayerSubscription,
	VoiceConnection,
	VoiceConnectionStatus,
	type AudioPlayer,
} from "@discordjs/voice";
import { queueManagers as sessionManagers } from "../shared";
import {
	prepareRandomClips,
	prepareAudioResource,
	type PlayingResource,
} from "./core";
import { AudioResource } from "@discordjs/voice";
import { shuffleArray } from "../utils";
import { log, error } from "console";
import { checkFolderSize } from "./fs";

export class SessionManager {
	queue: string[];
	fixedQueue: string[];
	currentPlayedItems: PlayingResource[];
	currentQueue: PlayingResource[];
	currentItem: PlayingResource | null;
	currentResource: AudioResource | null;
	currentSongBuffer: Buffer | null;
	audioPlayer: AudioPlayer;
	connection: VoiceConnection;

	preparingResources: boolean;

	clipLength: number;
	clipNumber: number;

	volume: number;

	constructor(
		subscription: PlayerSubscription,
		clipNumber: number,
		clipLength: number,
		queue: string[] = [],
	) {
		this.audioPlayer = subscription.player;
		this.connection = subscription.connection;
		this.queue = queue;
		this.fixedQueue = [...queue];

		this.currentItem = null;
		this.currentResource = null;
		this.currentQueue = [];
		this.currentSongBuffer = null;
		this.currentPlayedItems = [];

		this.clipLength = clipLength;
		this.clipNumber = clipNumber;
		this.preparingResources = false;
		this.volume = 1;
	}
	addToQueue(videoId: string): void {
		this.queue.push(videoId);
		if (!this.fixedQueue.includes(videoId)) this.fixedQueue.push(videoId);
	}

	setVolume(volume: number) {
		if (volume < 0 || volume > 2) {
			throw new Error("Volume must be between 0 and 2");
		}
		this.volume = volume;
		this.currentResource?.volume?.setVolume(volume);
	}

	nextClip() {
		const picked = this.currentQueue.shift();
		if (!picked) return null;
		if (this.currentItem) this.currentPlayedItems.push(this.currentItem);
		this.currentItem = picked;
		return this.currentItem;
	}

	async nextSong(
		shuffle = true,
		stack = 0,
		maxStack = 5,
	): Promise<PlayingResource | null> {
		const index = Math.floor(this.queue.length * Math.random());
		const picked = this.queue.splice(index, 1)[0];
		if (!picked) return null;
		log(`Picked ${picked}`);
		this.preparingResources = true;
		this.currentPlayedItems = [];
		await checkFolderSize();
		const clips = await prepareRandomClips({
			id: picked,
			clipLength: this.clipLength,
			clipNumbers: this.clipNumber,
		}).catch((err) => {
			error(err);
			return null;
		});
		if (!clips) {
			if (stack >= maxStack) {
				throw new Error(
					`Failed to prepare resources for ${picked} after ${maxStack} attempts.`,
				);
			}
			return await this.nextSong(shuffle, stack + 1, maxStack);
		}
		const { resources, buffer } = clips;
		this.currentSongBuffer = buffer;
		const [firstResource, ...remainResources] = shuffle
			? shuffleArray(resources)
			: resources;
		this.preparingResources = false;
		if (!firstResource) return null;
		this.currentItem = firstResource;
		this.currentQueue = remainResources;
		return this.currentItem;
	}

	play(buffer: Buffer) {
		this.currentResource = prepareAudioResource(buffer);
		this.currentResource.volume?.setVolume(this.volume);
		this.audioPlayer.play(this.currentResource);
	}

	playCurrentFullSong() {
		if (!this.currentItem || !this.currentSongBuffer) return null;
		this.play(this.currentSongBuffer);
		return this.currentItem;
	}

	playCurrentClip() {
		if (!this.currentItem) return null;
		this.play(this.currentItem.buffer);
		return this.currentItem;
	}

	playNextClip() {
		const clip = this.nextClip();
		if (!clip) return null;
		this.play(clip.buffer);
		return clip;
	}
	playLastClip() {
		if (this.currentPlayedItems.length === 0 || !this.currentItem)
			return null;
		const clip = this.currentPlayedItems.pop();
		if (!clip) return null;
		this.currentQueue.unshift(this.currentItem);
		this.currentItem = clip;
		this.play(clip.buffer);
		return clip;
	}
}

export function createSessionManager(
	guildId: string,
	connection: VoiceConnection,
	clipNumber: number,
	clipLength: number,
	queue: string[] = [],
): SessionManager {
	const audioPlayer = createAudioPlayer();
	const subscription = connection.subscribe(audioPlayer);
	if (!subscription) {
		throw new Error("Failed to subscribe to the voice connection.");
	}
	connection.on("stateChange", (state) => {
		if (state.status === VoiceConnectionStatus.Disconnected) {
			destroySessionManager(guildId);
		}
	});
	const manager = new SessionManager(
		subscription,
		clipNumber,
		clipLength,
		queue,
	);
	sessionManagers.set(guildId, manager);
	return manager;
}

export function getSessionManager(guildId: string): SessionManager | null {
	return sessionManagers.get(guildId) ?? null;
}

export function hasSessionManager(guildId: string): boolean {
	return sessionManagers.has(guildId);
}

export function destroySessionManager(guildId: string) {
	const manager: SessionManager | undefined = sessionManagers.get(guildId);
	if (manager) {
		manager.audioPlayer.stop();
		manager.connection.destroy();
		sessionManagers.delete(guildId);
		return true;
	}
	return false;
}
