import { Client, IntentsBitField } from "discord.js";
import { createCommandManager } from "../commands/manager";
import { getFlags } from "../env/flag";

export const client = new Client({
	intents: [IntentsBitField.Flags.Guilds],
});
export const manager = await createCommandManager();
export const flags = getFlags();
