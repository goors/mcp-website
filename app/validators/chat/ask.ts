import z from "zod";
export const historyRecord = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    tags: z.array(z.string()).default(["general"]),
})
export const askModel = z.object({
    user_id: z.string(),
    prompt: z.string(),
    history: historyRecord.array(),
    tags: z.array(z.string()).default(["general"]),
    deepThink: z.boolean()
})

export const history = historyRecord.array()

export const chatResponse = z.instanceof(Response);

export type AskModel = z.infer<typeof askModel>;
export type HistoryRecord = z.infer<typeof historyRecord>;
export type History = z.infer<typeof history>;
export type ChatResponse = z.infer<typeof chatResponse>;