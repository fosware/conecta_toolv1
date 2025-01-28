import { z } from "zod";

export const locationStateSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string()
});

export type LocationState = z.infer<typeof locationStateSchema>;

export const locationStateCreateSchema = locationStateSchema.omit({ 
  id: true 
});
