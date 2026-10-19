import { z } from 'zod';

export const FetchioOptionSchema = z
  .object({
    debug: z.boolean().default(false),
    lang: z.string(),
  })
  .partial();
