import { existsSync, mkdirSync } from "fs";
import { appendFile } from "fs/promises";
import { join } from "path";
import { flags } from "../lib/shared";
import { doubleDash, singleDash } from "./env/flag";
import colors from "colors/safe";
import { DEV } from "./env/env";

const baseLogPath = join(process.cwd(), "logs");
const logFilePath = join(baseLogPath, DEV ? "dev/log.txt" : "log.txt");
const errorLogFilePath = join(baseLogPath, DEV ? "dev/error.txt" : "error.txt");
const debugFilePath = join(baseLogPath, DEV ? "dev/debug.txt" : "debug.txt");

if (!existsSync(baseLogPath)) {
	mkdirSync(baseLogPath, { recursive: true });
}

export function log(...data: unknown[]) {
	if (flags.getFlagValue([singleDash("L"), doubleDash("log")], true)) {
		console.log(...data);
	}
	const logMessage = `[LOG] ${new Date().toISOString()}: ${data.join(" ")}\n`;
	appendFile(logFilePath, logMessage).catch((err) =>
		console.error("[UNLOGGED] Failed to write to log file:", err),
	);
}
export function error(...data: unknown[]) {
	console.error(colors.red(data.join(" ")));
	const errorMessage = `[ERR] ${new Date().toISOString()}: ${data.join(" ")}\n`;
	appendFile(errorLogFilePath, errorMessage).catch((err) =>
		console.error("[UNLOGGED] Failed to write to error log file:", err),
	);
}
export function warn(...data: unknown[]) {
	if (!flags.getFlagValue([singleDash("N"), doubleDash("no_warn")], true)) {
		console.warn(colors.yellow(data.join(" ")));
	}
	const warnMessage = `[WARN] ${new Date().toISOString()}: ${data.join(" ")}\n`;
	appendFile(logFilePath, warnMessage).catch((err) =>
		console.error("[UNLOGGED] Failed to write to log file:", err),
	);
}

export function important(...data: unknown[]) {
	if (
		!flags.getFlagValue([singleDash("N"), doubleDash("no_important")], true)
	) {
		console.log(colors.bold(data.join(" ")));
	}
	const importantMessage = `[IMP] ${new Date().toISOString()}: ${data.join(" ")}\n`;
	appendFile(logFilePath, importantMessage).catch((err) =>
		console.error("[UNLOGGED] Failed to write to log file:", err),
	);
}

export function debug(...data: unknown[]) {
	if (
		flags.getFlagValue(
			[singleDash("D"), singleDash("B"), doubleDash("debug")],
			true,
		)
	) {
		console.log(colors.bgMagenta(data.join(" ")));
	}
	const debugMessage = `[DEBUG] ${new Date().toISOString()}: ${data.join(" ")}\n`;
	appendFile(debugFilePath, debugMessage).catch((err) =>
		console.error("[UNLOGGED] Failed to write to log file:", err),
	);
}
