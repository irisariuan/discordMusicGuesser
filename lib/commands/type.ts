import type {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";

export interface BasicCommandFile {
	commmandBuilder: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => PromiseLike<unknown>;
}
export interface CommandFile extends BasicCommandFile {
	name: string;
}
