import { loadCommands } from "./load";
import type { CommandFile } from "./type";

export async function createCommandManager() {
	const manager = new CommandManager();
	await manager.load();
	return manager;
}

class CommandManager {
	private commands: CommandFile[];
	constructor() {
		this.commands = [];
	}
	async load() {
		this.commands = await loadCommands();
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
