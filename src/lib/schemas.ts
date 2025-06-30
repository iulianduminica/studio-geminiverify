
import { z } from 'zod';

export const InviteUserInputSchema = z.object({
  userName: z.string().min(2, { message: "Name must be at least 2 characters." }),
});
export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;

export const InviteUserOutputSchema = z.object({
  success: z.boolean(),
  newWorkoutId: z.string().optional(),
  message: z.string(),
});
export type InviteUserOutput = z.infer<typeof InviteUserOutputSchema>;
