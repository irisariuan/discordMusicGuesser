import { Events, MessageFlags } from "discord.js";
import {
	getAllRegisteredCommandNames,
	registerCommands,
} from "./lib/commands/register";
import { DEV, DEV_TOKEN, TOKEN } from "./lib/env/env";
import { doubleDash, singleDash } from "./lib/env/flag";
import buttonInteractionHandler from "./lib/interactionHandler";
import { error, important, log } from "./lib/log";
import { client, flags, manager } from "./lib/shared";
import { compareArraysContent } from "./lib/utils";
import { audioPromiseQueue } from "./lib/voice/fs";

(async () => {
	if (flags.getAllFlags().length > 0) {
		for (const flag of flags.getAllFlags()) {
			log(`${flag.name} : ${flag.value ?? "(NO VALUE)"}`);
		}
	}
	const forceRefreshingCommands =
		flags.getFlagValue(
			[doubleDash("refreshCommands"), singleDash("R")],
			true,
		) === true;
	if (
		forceRefreshingCommands ||
		!compareArraysContent(
			(await getAllRegisteredCommandNames()) ?? [],
			(await manager).getAllCommandNames(),
		)
	) {
		if (forceRefreshingCommands) {
			important("Refreshing commands...");
		} else {
			important("Command files change detected, refreshing...");
		}
		const allCommands = (await manager).getAllCommands();
		important(
			"Registering",
			allCommands.map((v) => v.name).join(", "),
			`Total: ${allCommands.length}`,
		);
		await registerCommands(allCommands)
			.then(() => important("Commands registered successfully"))
			.catch((err) => error("Failed to register commands:", err));
	}
	client.login(DEV ? DEV_TOKEN : TOKEN);
})();

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand() && !interaction.isButton()) return;
	try {
		if (interaction.isButton()) {
			return await buttonInteractionHandler(interaction);
		}
		const command = (await manager).getCommand(interaction.commandName);
		if (!command) {
			return await interaction.reply({
				content: "This command does not exist.",
				flags: [MessageFlags.Ephemeral],
			});
		}
		command.execute(interaction);
	} catch (err) {
		error("Error executing command:", err);
		interaction
			.reply({
				content: "There was an error while executing this command.",
				flags: [MessageFlags.Ephemeral],
			})
			.catch(() => {
				interaction
					.editReply({
						content:
							"There was an error while executing this command.",
					})
					.catch(() => {
						interaction
							.followUp({
								content:
									"There was an error while executing this command.",
								flags: [MessageFlags.Ephemeral],
							})
							.catch(() => {
								error("Failed to send error message");
							});
					});
			});
	}
});

client.on(Events.ClientReady, () => {
	important(`Bot started as ${client.user?.tag ?? "(NULL)"}`);
});

process.on("uncaughtException", (err) => {
	error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (err) => {
	error("Unhandled Rejection:", err);
});

process.on("SIGINT", () => {
	log("Type /exit to exit");
});

process.stdin.on("data", async (data) => {
	const textDecoder = new TextDecoder();
	const input = textDecoder.decode(data).trim();
	switch (input) {
		case "/exit":
			important("Exiting...");
			await client.destroy();
			important("Awaiting all downloads to finish...");
			await Promise.all(audioPromiseQueue);
			important("All downloads finished.");
			log("Goodbye!");
			process.exit(0);
			break;
	}
});
