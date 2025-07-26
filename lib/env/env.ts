import "dotenv/config";
import { flags } from "../shared";
import { doubleDash, singleDash } from "./flag";

export const DEV =
	flags.getFlagValue([singleDash("D"), doubleDash("dev")], true) === true;
export const NO_AI = flags.getFlagValue([doubleDash("noAI")], true)

// Production mode

if (!DEV && !process.env.TOKEN) {
	throw new Error("Missing environment variable: TOKEN");
}
if (!DEV && !process.env.CLIENT_ID) {
	throw new Error("Missing environment variable: CLIENT_ID");
}

export const TOKEN = process.env.TOKEN || "";
export const CLIENT_ID = process.env.CLIENT_ID || "";
export const OPENROUTER_TOKEN = process.env.OPENROUTER_TOKEN ?? null;
export const MODEL = process.env.MODEL ?? null

// DEV mode

if (DEV && !process.env.DEV_TOKEN) {
	throw new Error("Missing environment variable: DEV_TOKEN");
}
if (DEV && !process.env.DEV_CLIENT_ID) {
	throw new Error("Missing environment variable: DEV_CLIENT_ID");
}

export const DEV_TOKEN = process.env.DEV_TOKEN || "";
export const DEV_CLIENT_ID = process.env.DEV_CLIENT_ID || "";
export const DEV_OPENROUTER_TOKEN = process.env.DEV_OPENROUTER_TOKEN ?? null;
export const DEV_MODEL = process.env.DEV_MODEL ?? null;