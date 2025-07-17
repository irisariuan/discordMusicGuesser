export interface GameItem {
	url: string;
}

export class GameSessionManager {
	queue: string[];
	currentItem: GameItem | null;
	constructor(queue: string[] = []) {
		this.queue = queue;
		this.currentItem = null;
	}
	addToQueue(url: string): void {
		this.queue.push(url);
	}
	pick() {
		const index = Math.floor(this.queue.length * Math.random());
		const picked = this.queue.splice(index, 1)[0];
		if (picked) {
			this.currentItem = { url: picked };
		} else {
			this.currentItem = null;
		}
		return this.currentItem;
	}
}
