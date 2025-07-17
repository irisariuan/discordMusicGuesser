import { Events } from "discord.js";
import {
	getAllRegisteredCommandNames,
	registerCommands,
} from "./lib/commands/register";
import { DEV, DEV_TOKEN, TOKEN } from "./lib/env/env";
import { doubleDash, singleDash } from "./lib/env/flag";
import { client, flags, manager } from "./lib/share/shared";
import { compareArraysContent } from "./lib/utils";

if (flags.getAllFlags().length > 0) {
	for (const flag of flags.getAllFlags()) {
		console.log(`${flag.name} : ${flag.value ?? "(NO VALUE)"}`);
	}
}

if (
	!compareArraysContent(
		(await getAllRegisteredCommandNames()) ?? [],
		manager.getAllCommandNames(),
	) ||
	flags.getFlagValue(
		[doubleDash("refreshCommands"), singleDash("R")],
		true,
	) === true
) {
	if (
		flags.getFlagValue(
			[doubleDash("refreshCommands"), singleDash("R")],
			true,
		) === true
	) {
		console.log("Refreshing commands...");
	} else {
		console.log("Command files change detected, refreshing...");
	}
	await registerCommands(manager.getAllCommands());
	console.log("Commands registered successfully");
}

client.on(Events.InteractionCreate, (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = manager.getCommand(interaction.commandName);
	if (!command) {
		return interaction.reply({
			content: "This command does not exist.",
			ephemeral: true,
		});
	}
	Promise.try(() => command.execute(interaction)).catch((error) => {
		console.error("Error executing command:", error);
		interaction
			.reply({
				content: "There was an error while executing this command.",
				ephemeral: true,
			})
			.catch(() => console.error("Failed to send error message"));
	});
});

client.on(Events.ClientReady, () => {
	console.log("Bot started");
});

client.login(DEV ? DEV_TOKEN : TOKEN);
