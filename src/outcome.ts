export type Outcome = "completed" | "interrupted" | "paused-budget" | "requires-action" | "error" | "terminated" | "incomplete";
export function classify(status: string, reason: string | undefined, interrupted: boolean): Outcome {
  if (status === "terminated") return "terminated";
  if (status !== "idle") return "incomplete";
  if (reason === "requires_action") return "requires-action";
  if (reason === "budget_reached") return "paused-budget";
  if (reason === "end_turn") return interrupted ? "interrupted" : "completed";
  return "error";
}
