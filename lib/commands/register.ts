import { CLIENT_ID, TOKEN } from "../env/env";
import type { BasicCommandFile } from "./type";
import { REST, Routes } from "discord.js";

const rest = new REST().setToken(TOKEN);

export async function registerCommands(commandFiles: BasicCommandFile[]) {
	const commands = commandFiles.map((file) => file.commmandBuilder);
	try {
		await rest.put(Routes.applicationCommands(CLIENT_ID), {
			body: commands,
		});
		return true;
	} catch {
		return false;
	}
}

export async function getAllRegisteredCommandNames() {
	try {
		const result = (await rest.get(
			Routes.applicationCommands(CLIENT_ID),
		)) as { name: string }[];
		return result.map((command) => command.name);
	} catch {
		return null;
	}
}
