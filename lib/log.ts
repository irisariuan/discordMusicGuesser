import { existsSync, mkdirSync } from "fs";
import { appendFile } from "fs/promises";
import { join } from "path";
import { flags } from "../lib/shared";
import { doubleDash, singleDash } from "./env/flag";

const baseLogPath = join(process.cwd(), "logs");
const logFilePath = join(baseLogPath, "log.txt");
const errorLogFilePath = join(baseLogPath, "error.txt");

if (!existsSync(baseLogPath)) {
	mkdirSync(baseLogPath);
}

export function log(...data: unknown[]) {
	if (flags.getFlagValue([singleDash("L"), doubleDash("log")], true)) {
		console.log(...data);
	}
	const logMessage = `${new Date().toISOString()} - ${data.join(" ")}\n`;
	appendFile(logFilePath, logMessage).catch((err) =>
		console.error("[UNLOGGED] Failed to write to log file:", err),
	);
}
export function error(...data: unknown[]) {
	console.error(...data);
	const errorMessage = `${new Date().toISOString()} - ${data.join(" ")}\n`;
	appendFile(errorLogFilePath, errorMessage).catch((err) =>
		console.error("[UNLOGGED] Failed to write to error log file:", err),
	);
}
export function warn(...data: unknown[]) {
	if (!flags.getFlagValue([singleDash("N"), doubleDash("no_warn")], true)) {
		console.warn(...data);
	}
	const warnMessage = `${new Date().toISOString()} - ${data.join(" ")}\n`;
	appendFile(logFilePath, warnMessage).catch((err) =>
		console.error("[UNLOGGED] Failed to write to log file:", err),
	);
}
