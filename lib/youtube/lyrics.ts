import { JSDOM } from "jsdom";
import {
	DEV,
	DEV_MODEL,
	DEV_OPENROUTER_TOKEN,
	MODEL,
	OPENROUTER_TOKEN,
} from "../env/env";
import { doubleDash } from "../env/flag";
import { error } from "../log";
import { flags } from "../shared";
import { OpenRouterResponse } from "../typings/openRouter";
import { CacheItem } from "../utils";
import { getTitle, setTitle } from "./lyrics/fs";

const constantCache = new CacheItem<string>(undefined, 5 * 60 * 1000); // 5 minutes

async function getConstant() {
	if (constantCache.hasValue()) return constantCache.get() ?? null;
	const jsFile = await fetch("https://www.azlyrics.com/geo.js");
	if (!jsFile.ok) {
		error("Failed to fetch geo.js:", jsFile.status, jsFile.statusText);
		return null;
	}
	const jsText = await jsFile.text();
	const jsLines = jsText.split("\n");
	const searchLine = jsLines.find((line) =>
		/ep\.setAttribute\("value", "([^"]+)"\);/.test(line),
	);
	const baseValue = searchLine?.match(
		/ep\.setAttribute\("value", "([^"]+)"\);/,
	);
	if (baseValue) {
		constantCache.set(baseValue[1]);
		return baseValue[1];
	}
	return null;
}

export interface SongSearch {
	artist: string;
	song: string;
	url: string;
}

export async function searchSong(query: string) {
	const baseUrl = new URL("https://search.azlyrics.com/search.php");
	const constant = await getConstant();
	if (!constant) return null;
	baseUrl.searchParams.set("q", query);
	baseUrl.searchParams.set("x", constant);
	const res = await fetch(baseUrl);
	const dom = new JSDOM(await res.text());
	const el = dom.window.document
		.querySelector(".panel table.table")
		?.querySelectorAll("td.text-left.visitedlyr>a");
	const result: SongSearch[] = [];
	el?.forEach((node) => {
		const contentNode = node.querySelectorAll("b");
		const songNode = contentNode.item(0);
		const artistNode = contentNode.item(1);
		const link = node.getAttribute("href");
		if (!songNode.textContent || !artistNode.textContent || !link) return;
		result.push({
			artist: artistNode.textContent,
			song: songNode.textContent.slice(1, -1), // remove the quotes
			url: link,
		});
	});
	return result.length > 0 ? result : null;
}

export async function getLyrics(url: string) {
	const res = await fetch(url);
	if (!res.ok) {
		error("Failed to fetch lyrics:", res.status, res.statusText);
		return null;
	}
	const dom = new JSDOM(await res.text());
	const el = dom.window.document.querySelector(
		"div.col-xs-12.col-lg-8.text-center>br+br+div:has(+ br)",
	);
	if (el) {
		const result: string[][] = [[]];
		el.childNodes.forEach((node) => {
			console.log(node.textContent);
			if (
				node.nodeName === "#text" &&
				node.textContent &&
				node.textContent.trim().length > 0
			) {
				result[result.length - 1].push(node.textContent.trim());
			}
			if (node.nodeName === "I") {
				if (result[result.length - 1].length > 0) {
					console.log("splitted", node.textContent);
					result.push([]);
				}
			}
		});
		return result;
	}
	return null;
}

export async function obtainTitle(titleString: string, timeout = 10 * 1000) {
	const token = DEV ? DEV_OPENROUTER_TOKEN : OPENROUTER_TOKEN;
	const model = DEV ? DEV_MODEL : MODEL;
	if (
		!token ||
		!model ||
		flags.getFlagValue([doubleDash("noTitleCleaning")], true)
	) {
		return null;
	}
	const cachedTitle = getTitle(titleString);
	if (cachedTitle) return cachedTitle;
	const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			messages: [
				{
					role: "system",
					content:
						"Obtain the title from the input, return the obtained title only, remove parentheses if any, remove the artist name if any, do not return any other text.",
				},
				{
					role: "user",
					content: titleString,
				},
			],
		}),
		signal: timeout > 0 ? AbortSignal.timeout(timeout) : undefined,
	});
	if (!res.ok) {
		error(
			"Failed to obtain title:",
			res.status,
			res.statusText,
			await res.text().catch(() => "(ERROR)"),
		);
		return null;
	}
	const data: OpenRouterResponse | null = await res.json().catch(() => null);
	if (!data) return null;
	if (data.choices && data.choices.length > 0) {
		if (data.choices[0].message.content) {
			setTitle(titleString, data.choices[0].message.content);
		}
		return data.choices[0].message.content;
	}
	error("No choices found in the response:", data);
	return null;
}
