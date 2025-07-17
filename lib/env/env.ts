import "dotenv/config";
import { flags } from "../share/shared";
import { doubleDash, singleDash } from "./flag";

export const DEV =
	flags.getFlagValue([singleDash("D"), doubleDash("dev")], true) === true;

// Production mode

if (!DEV && !process.env.TOKEN) {
	throw new Error("Missing environment variable: TOKEN");
}
if (!DEV && !process.env.CLIENT_ID) {
	throw new Error("Missing environment variable: CLIENT_ID");
}

export const TOKEN = process.env.TOKEN || "";
export const CLIENT_ID = process.env.CLIENT_ID || "";

// DEV mode

if (DEV && !process.env.DEV_TOKEN) {
	throw new Error("Missing environment variable: DEV_TOKEN");
}
if (DEV && !process.env.DEV_CLIENT_ID) {
	throw new Error("Missing environment variable: DEV_CLIENT_ID");
}

export const DEV_TOKEN = process.env.DEV_TOKEN || "";
export const DEV_CLIENT_ID = process.env.DEV_CLIENT_ID || "";
