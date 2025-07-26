import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { debug } from "../../log";

const basePath = join(process.cwd(), "data", "titles.json");
const basePathFolder = join(process.cwd(), "data");
if (!existsSync(basePathFolder)) {
	mkdirSync(basePathFolder);
}
if (!existsSync(basePath)) {
	writeFileSync(basePath, "{}", "utf8");
}
let currentTitles: { [key: string]: string } = readTitlesFile();

function readTitlesFile(): { [key: string]: string } {
	return JSON.parse(readFileSync(basePath, "utf8"));
}

export function getTitle(rawTitle: string): string | null {
	if (!(rawTitle in currentTitles)) return null;
	return currentTitles[rawTitle];
}

export function setTitle(rawTitle: string, title: string): void {
	if (rawTitle in currentTitles) {
		debug(`Updating title for "${rawTitle}" to "${title}"`);
	} else {
		debug(`Adding new title for "${rawTitle}" as "${title}"`);
	}
	currentTitles[rawTitle] = title;
}

export async function writeToTitlesFile() {
	return await writeFile(
		basePath,
		JSON.stringify(currentTitles, null, 4),
		"utf8",
	);
}