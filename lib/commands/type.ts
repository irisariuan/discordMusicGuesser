import type {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
} from "discord.js";

export interface BasicCommandFile {
	commmandBuilder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
	execute: (interaction: ChatInputCommandInteraction) => PromiseLike<unknown>;
}
export interface CommandFile extends BasicCommandFile {
	name: string;
}
