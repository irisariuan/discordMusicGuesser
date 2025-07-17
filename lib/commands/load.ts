import { Glob } from "bun";
import { join } from "path";
import type { BasicCommandFile, CommandFile } from "./type";

export async function listCommandFiles() {
	const glob = new Glob("commands/**/*.ts");
	const files: string[] = [];
	for await (const file of glob.scan(process.cwd())) {
		files.push(file);
	}
	return files;
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
