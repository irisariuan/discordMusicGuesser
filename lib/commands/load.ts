import { glob } from "glob";
import { join } from "path";
import type { BasicCommandFile, CommandFile } from "./type";

export function listCommandFiles() {
	return glob("commands/**/*.(ts|js)");
}

export async function loadCommands(): Promise<CommandFile[]> {
	const files = await listCommandFiles();
	const commands: CommandFile[] = [];
	for (const file of files) {
		const command: { default: BasicCommandFile } | null = await import(
			join(process.cwd(), file)
		).catch(() => null);
		if (command?.default) {
			commands.push({
				...command.default,
				name: command.default.commmandBuilder.name,
			} as CommandFile);
		}
	}
	return commands;
}
