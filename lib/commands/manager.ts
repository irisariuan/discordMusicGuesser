import { loadCommands } from "./load";
import type { CommandFile } from "./type";

export async function createCommandManager() {
	const manager = new CommandManager();
	await manager.load();
	return manager;
}

export class CommandManager {
	private commands: CommandFile[];
	readonly compiled: boolean;

	constructor() {
		this.commands = [];
		this.compiled = process.argv[1]?.endsWith(".js");
	}
	async load() {
		this.commands = await loadCommands(this.compiled);
	}
	getCommand(name: string) {
		return (
			this.commands.find(
				(command) => command.commmandBuilder.name === name,
			) ?? null
		);
	}
	getAllCommands() {
		return this.commands;
	}
	getAllCommandNames() {
		return this.commands.map((command) => command.name);
	}
}
