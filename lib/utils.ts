export function compareArraysContent(arr1: string[], arr2: string[]) {
	if (arr1.length !== arr2.length) {
		return false;
	}

	const set1 = new Set(arr1);
	const set2 = new Set(arr2);
	for (const item of set1) {
		if (!set2.has(item)) {
			return false;
		}
	}

	return true;
}

export function partialSplit(
	str: string,
	separator: string,
	max = Number.POSITIVE_INFINITY,
) {
	const parts = str.split(separator);
	if (parts.length <= max) {
		return parts;
	}
	return [...parts.slice(0, max - 1), parts.slice(max - 1).join(separator)];
}

export function anyInclude<T>(...arr: (T[] | T)[]) {
	const existed = new Set<T>();
	for (const item of arr) {
		if (Array.isArray(item)) {
			for (const subItem of item) {
				if (existed.has(subItem)) {
					return true;
				}
			}
			for (const subItem of item) {
				existed.add(subItem);
			}
		} else {
			if (existed.has(item)) {
				return true;
			}
			existed.add(item);
		}
	}
	return false;
}

export function randomFloat(from: number, to: number) {
	if (from > to) {
		throw new Error("From must be less than or equal to To");
	}
	return Math.random() * (to - from + 1) + from;
}

export function roundTo(num: number, decimal = 3) {
	return Number(num.toFixed(decimal));
}

export function shuffleArray<T>(array: Array<T>) {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		// @ts-expect-error
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}
