import { Client, IntentsBitField } from "discord.js";
import { createCommandManager } from "./commands/manager";
import { getFlags } from "./env/flag";
import type { SessionManager } from "./voice/session";

export const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildVoiceStates,
		IntentsBitField.Flags.GuildMessages,
	],
});
export const manager = createCommandManager();
export const flags = getFlags();
export const queueManagers = new Map<string, SessionManager>();
