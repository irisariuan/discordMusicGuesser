import z from "zod";
import {
	DEV,
	DEV_MODEL,
	DEV_OPENROUTER_TOKEN,
	MODEL,
	NO_AI,
	OPENROUTER_TOKEN,
} from "../env/env";
import { error } from "../log";
import { OpenRouterResponse } from "../typings/openRouter";

interface Secret {
	token: string | null;
	model: string | null;
}

export const responseSchema = z.object({
	id: z.string(),
	choices: z
		.object({
			finish_reason: z.string().nullable(),
			native_finish_reason: z.string().nullable(),
			message: z.object({
				content: z.string().nullable(),
				role: z.string(),
				tool_calls: z
					.array(
						z.object({
							id: z.string(),
							type: z.literal("function"),
							function: z.any(),
						}),
					)
					.optional(),
			}),
		})
		.array(),
	created: z.number(),
	model: z.string(),
	object: z.enum(["chat.completion", "chat.completion.chunk"]),
	system_fingerprint: z.string().optional(),
	usage: z
		.object({
			prompt_tokens: z.number(),
			completion_tokens: z.number(),
			total_tokens: z.number(),
		})
		.optional(),
});

export async function ask(
	query: string,
	systemPrompt: string,
	noAi = NO_AI,
	timeout = 5000,
	secret: Secret = {
		token: DEV ? DEV_OPENROUTER_TOKEN : OPENROUTER_TOKEN,
		model: DEV ? DEV_MODEL : MODEL,
	},
) {
	const { token, model } = secret;
	if (!token || !model || noAi) {
		return null;
	}
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
					content: systemPrompt,
				},
				{
					role: "user",
					content: query,
				},
			],
		}),
		signal: timeout > 0 ? AbortSignal.timeout(timeout) : undefined,
	});
	if (!res.ok) {
		error(
			"Failed to fetch OpenRouter API:",
			res.status,
			res.statusText,
			await res.text().catch(() => "(ERROR)"),
		);
		return null;
	}
	const data: OpenRouterResponse | null = await res.json().catch(() => null);
	if (!data || !responseSchema.safeParse(data).success) return null;
	if (data.choices && data.choices.length > 0) {
		return data.choices[0].message.content;
	}
	error("No choices found in the response:", data);
	return null;
}
