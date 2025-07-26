import { anyInclude, partialSplit } from "../utils";

export type BaseType = string | number | boolean;

export interface Flag {
	name: string;
	value?: BaseType;
	singleDash: boolean;
}

interface FlagComparable {
	name: string | string[];
	singleDash?: boolean;
}

function flagsCompare(
	origin: FlagComparable,
	comparing: FlagComparable,
): boolean {
	if (
		origin.singleDash !== undefined &&
		comparing.singleDash !== origin.singleDash
	) {
		return false;
	}
	return anyInclude(origin.name, comparing.name);
}

export class FlagCollection {
	private flags: Set<Flag>;

	constructor(flags?: Flag[]) {
		this.flags = new Set(flags);
	}

	public addFlag(flag: Flag): void {
		this.flags.add(flag);
	}

	public getFlagsAsSet(): Set<Flag> {
		return this.flags;
	}
	public getAllFlags(): Flag[] {
		return Array.from(this.flags);
	}

	public getFlag(...comparable: FlagComparable[]): Flag | undefined;
	public getFlag(
		comparable: FlagComparable | FlagComparable[],
	): Flag | undefined;
	public getFlag(comparable: FlagComparable[]): Flag | undefined;
	public getFlag(comparable: FlagComparable): Flag | undefined;
	public getFlag(
		comparable: FlagComparable | FlagComparable[],
	): Flag | undefined {
		if (Array.isArray(comparable)) {
			return this.getAllFlags().find((flag) =>
				comparable.some((comp) => flagsCompare(comp, flag)),
			);
		}
		return this.getAllFlags().find((flag) =>
			flagsCompare(comparable, flag),
		);
	}

	public hasFlag(comparable: FlagComparable | FlagComparable[]): boolean;
	public hasFlag(comparable: FlagComparable[]): boolean;
	public hasFlag(...comparable: FlagComparable[]): boolean;
	public hasFlag(comparable: FlagComparable): boolean;
	public hasFlag(comparable: FlagComparable | FlagComparable[]): boolean {
		if (Array.isArray(comparable)) {
			return comparable.some((comp) => this.hasFlag(comp));
		}
		return this.getAllFlags().some((flag) =>
			flagsCompare(comparable, flag),
		);
	}

	public getFlagValue<T = null>(
		comparable: FlagComparable | FlagComparable[],
		defaultValueIfExists: T = null as T,
	): BaseType | T | undefined {
		const flag = this.getFlag(comparable);
		return flag ? (flag.value ?? defaultValueIfExists) : undefined;
	}
}

function transformValue(str: string): BaseType {
	if (!Number.isNaN(Number(str))) {
		return Number(str);
	}
	const lowercase = str.toLowerCase();
	if (
		lowercase === "true" ||
		lowercase === "t" ||
		lowercase === "yes" ||
		lowercase === "y"
	) {
		return true;
	}
	if (
		lowercase === "false" ||
		lowercase === "f" ||
		lowercase === "no" ||
		lowercase === "n"
	) {
		return false;
	}
	return str;
}

export function getFlags(): FlagCollection {
	return new FlagCollection(parseFlags(process.argv.slice(2)));
}

export function parseFlags(args: string[]) {
	const flags: Flag[] = [];
	for (const arg of args) {
		if (arg.startsWith("--")) {
			const [untrimmedName, untrimmedValue] = partialSplit(
				arg.slice(2),
				"=",
				2,
			);
			if (!untrimmedName || untrimmedName.trim().length === 0) {
				continue; // Skip if the name is empty
			}
			const name = untrimmedName.trim();
			if (!untrimmedValue || untrimmedValue.trim().length === 0) {
				flags.push({ name, singleDash: false });
				continue;
			}
			const value = transformValue(untrimmedValue.trim());
			flags.push({ name, value, singleDash: false });
		} else if (arg.startsWith("-")) {
			const name = arg.slice(1);
			flags.push({ name, singleDash: true });
		}
	}
	return flags;
}

export function singleDash(name: string) {
	return { name, singleDash: true };
}

export function doubleDash(name: string) {
	return { name, singleDash: false };
}
