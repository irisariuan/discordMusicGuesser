import { glob } from "glob";
import { join } from "path";
import type { BasicCommandFile, CommandFile } from "./type";

export function listCommandFiles(compiled: boolean) {
	return glob(compiled ? "dist/commands/**/*.js" : "commands/**/*.ts");
}

export async function loadCommands(compiled: boolean): Promise<CommandFile[]> {
	const files = await listCommandFiles(compiled);
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
